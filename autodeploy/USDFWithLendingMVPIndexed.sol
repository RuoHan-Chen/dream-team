// File: USDFWithLendingMVPIndexed.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title USDF Stablecoin with Indexed Lending (MVP)
/// @notice ERC‑20 USDF token plus testing-only lending at 6% APY with loan IDs
contract USDFWithLendingMVPIndexed is ERC20 {
    uint256 public constant APY = 6;            // 6% annual interest
    uint256 public constant YEAR = 365 days;

    struct Loan {
        address borrower;
        uint256 principal;
        uint256 startTimestamp;
        bool active;
    }

    uint256 public nextLoanId;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoanIds;

    /// @param initialSupply Initial token supply minted to deployer
    constructor(uint256 initialSupply) ERC20("USDF", "USDF") {
        _mint(msg.sender, initialSupply);
        nextLoanId = 1;
    }

    /// @notice Mint USDF arbitrarily (for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Burn USDF arbitrarily (for testing)
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    /// @notice Create a new loan, locking `amount` of USDF
    /// @return loanId ID of the newly created loan
    function lend(uint256 amount) external returns (uint256 loanId) {
        require(amount > 0, "Amount must be > 0");

        // Pull tokens into contract
        _transfer(msg.sender, address(this), amount);

        loanId = nextLoanId++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            principal: amount,
            startTimestamp: block.timestamp,
            active: true
        });
        userLoanIds[msg.sender].push(loanId);
    }

    /// @notice Withdraw principal and accrued interest for a specific loan
    /// @param loanId ID of the loan to close
    function unsend(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(loan.borrower == msg.sender, "Not borrower");

        uint256 elapsed = block.timestamp - loan.startTimestamp;
        uint256 interest = (loan.principal * APY * elapsed) / (YEAR * 100);
        uint256 principal = loan.principal;

        // Mark loan inactive
        loan.active = false;

        // Return principal and mint interest
        _transfer(address(this), msg.sender, principal);
        _mint(msg.sender, interest);
    }

    /// @notice Fast-forward a loan's start timestamp by one year (testing)
    /// @param loanId ID of the loan to advance
    function testAdvanceOneYear(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.active, "Loan not active");
        require(loan.borrower == msg.sender, "Not borrower");

        loan.startTimestamp = block.timestamp - YEAR;
    }
}
