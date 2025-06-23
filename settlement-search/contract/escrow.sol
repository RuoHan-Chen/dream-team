// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract BooleanPredictionEscrow {
    enum MarketState { Open, Resolved }

    address public creator;
    address public oracle;
    string public question;
    uint256 public deadline;
    bool public resolvedOutcome;

    IERC20 public stablecoin; // e.g. PYUSD
    MarketState public state;

    mapping(address => Bet) public bets;
    address[] public participants;

    uint256 public totalTrue;
    uint256 public totalFalse;
    uint256 public totalPool;

    struct Bet {
        bool hasBet;
        bool prediction;
        uint256 amount;
        bool paidOut;
    }

    event BetPlaced(address indexed user, bool prediction, uint256 amount);
    event MarketResolved(bool outcome);
    event RewardDistributed(address indexed user, uint256 amount);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can resolve");
        _;
    }

    modifier inState(MarketState _state) {
        require(state == _state, "Invalid market state");
        _;
    }

    constructor(
        string memory _question,
        uint256 _deadline,
        address _oracle,
        address _stablecoin
    ) {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_oracle != address(0) && _stablecoin != address(0), "Invalid address");

        creator = msg.sender;
        oracle = _oracle;
        question = _question;
        deadline = _deadline;
        stablecoin = IERC20(_stablecoin);
        state = MarketState.Open;
    }

    function placeBet(bool prediction, uint256 amount) external inState(MarketState.Open) {
        require(block.timestamp < deadline, "Betting closed");
        require(amount > 1, "Amount must be > 1");
        require(!bets[msg.sender].hasBet, "Already bet");

        require(stablecoin.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        bets[msg.sender] = Bet(true, prediction, amount, false);
        participants.push(msg.sender);

        if (prediction) {
            totalTrue += amount;
        } else {
            totalFalse += amount;
        }

        totalPool += amount;
        emit BetPlaced(msg.sender, prediction, amount);
    }

    function resolveAndDistribute(bool outcome) external onlyOracle inState(MarketState.Open) {
        resolvedOutcome = outcome;
        state = MarketState.Resolved;
        emit MarketResolved(outcome);

        uint256 winningPool = outcome ? totalTrue : totalFalse;

        for (uint256 i = 0; i < participants.length; i++) {
            address user = participants[i];
            Bet storage b = bets[user];
            if (!b.paidOut && b.prediction == outcome) {
                uint256 payout = (b.amount * totalPool) / winningPool;
                b.paidOut = true;
                require(stablecoin.transfer(user, payout), "Payout failed");
                emit RewardDistributed(user, payout);
            }
        }
    }
}