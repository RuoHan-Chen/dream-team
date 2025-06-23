/// <reference lib="dom" />
import { isBrowserEnvironment } from '@openai/agents-core/_shims';
import { UserError } from '@openai/agents-core';
import logger from "./logger.js";
import { OpenAIRealtimeBase, } from "./openaiRealtimeBase.js";
import { parseRealtimeEvent } from "./openaiRealtimeEvents.js";
import { HEADERS } from "./utils.js";
/**
 * Transport layer that's handling the connection between the client and OpenAI's Realtime API
 * via WebRTC. While this transport layer is designed to be used within a RealtimeSession, it can
 * also be used standalone if you want to have a direct connection to the Realtime API.
 *
 * Unless you specify a `mediaStream` or `audioElement` option, the transport layer will
 * automatically configure the microphone and audio output to be used by the session.
 */
export class OpenAIRealtimeWebRTC extends OpenAIRealtimeBase {
    options;
    #url;
    #state = {
        status: 'disconnected',
        peerConnection: undefined,
        dataChannel: undefined,
    };
    #useInsecureApiKey;
    #ongoingResponse = false;
    #muted = false;
    constructor(options = {}) {
        if (typeof RTCPeerConnection === 'undefined') {
            throw new Error('WebRTC is not supported in this environment');
        }
        super(options);
        this.options = options;
        this.#url = options.baseUrl ?? `https://api.openai.com/v1/realtime`;
        this.#useInsecureApiKey = options.useInsecureApiKey ?? false;
    }
    /**
     * The current status of the WebRTC connection.
     */
    get status() {
        return this.#state.status;
    }
    /**
     * The current connection state of the WebRTC connection including the peer connection and data
     * channel.
     */
    get connectionState() {
        return this.#state;
    }
    /**
     * Whether the session is muted.
     */
    get muted() {
        return this.#muted;
    }
    /**
     * Connect to the Realtime API. This will establish the connection to the OpenAI Realtime API
     * via WebRTC.
     *
     * If you are using a browser, the transport layer will also automatically configure the
     * microphone and audio output to be used by the session.
     *
     * @param options - The options for the connection.
     */
    async connect(options) {
        if (this.#state.status === 'connected') {
            return;
        }
        if (this.#state.status === 'connecting') {
            logger.warn('Realtime connection already in progress. Please await original promise');
        }
        const model = options.model ?? this.currentModel;
        this.currentModel = model;
        const baseUrl = options.url ?? this.#url;
        const apiKey = await this._getApiKey(options);
        const isClientKey = typeof apiKey === 'string' && apiKey.startsWith('ek_');
        if (isBrowserEnvironment() && !this.#useInsecureApiKey && !isClientKey) {
            throw new UserError('Using the WebRTC connection in a browser environment requires an insecure API key. Please use a WebSocket connection instead or set the useInsecureApiKey option to true.');
        }
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const userSessionConfig = {
                    ...(options.initialSessionConfig || {}),
                    model: this.currentModel,
                };
                const connectionUrl = new URL(baseUrl);
                let peerConnection = new RTCPeerConnection();
                const dataChannel = peerConnection.createDataChannel('oai-events');
                this.#state = {
                    status: 'connecting',
                    peerConnection,
                    dataChannel,
                };
                this.emit('connection_change', this.#state.status);
                dataChannel.addEventListener('open', () => {
                    this.#state = {
                        status: 'connected',
                        peerConnection,
                        dataChannel,
                    };
                    // Sending the session config again here once the channel is connected to ensure
                    // that the session config is sent to the server before the first response is received
                    // Setting it on connection should work but the config is not being validated on the
                    // server. This triggers a validation error if the config is not valid.
                    this.updateSessionConfig(userSessionConfig);
                    this.emit('connection_change', this.#state.status);
                    this._onOpen();
                    resolve();
                });
                dataChannel.addEventListener('error', (event) => {
                    this.close();
                    this._onError(event);
                    reject(event);
                });
                dataChannel.addEventListener('message', (event) => {
                    this._onMessage(event);
                    const { data: parsed, isGeneric } = parseRealtimeEvent(event);
                    if (!parsed || isGeneric) {
                        return;
                    }
                    if (parsed.type === 'response.created') {
                        this.#ongoingResponse = true;
                    }
                    else if (parsed.type === 'response.done') {
                        this.#ongoingResponse = false;
                    }
                    if (parsed.type === 'session.created') {
                        this._tracingConfig = parsed.session.tracing;
                        // Trying to turn on tracing after the session is created
                        this._updateTracingConfig(userSessionConfig.tracing ?? 'auto');
                    }
                });
                // set up audio playback
                const audioElement = this.options.audioElement ?? document.createElement('audio');
                audioElement.autoplay = true;
                peerConnection.ontrack = (event) => {
                    audioElement.srcObject = event.streams[0];
                };
                // get microphone stream
                const stream = this.options.mediaStream ??
                    (await navigator.mediaDevices.getUserMedia({
                        audio: true,
                    }));
                peerConnection.addTrack(stream.getAudioTracks()[0]);
                if (this.options.changePeerConnection) {
                    peerConnection =
                        await this.options.changePeerConnection(peerConnection);
                    this.#state = { ...this.#state, peerConnection };
                }
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                if (!offer.sdp) {
                    throw new Error('Failed to create offer');
                }
                const sessionConfig = {
                    ...this._getMergedSessionConfig(userSessionConfig),
                    model: this.currentModel,
                };
                const data = new FormData();
                data.append('sdp', offer.sdp);
                data.append('session', JSON.stringify(sessionConfig));
                const sdpResponse = await fetch(connectionUrl, {
                    method: 'POST',
                    body: data,
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'X-OpenAI-Agents-SDK': HEADERS['X-OpenAI-Agents-SDK'],
                    },
                });
                const answer = {
                    type: 'answer',
                    sdp: await sdpResponse.text(),
                };
                await peerConnection.setRemoteDescription(answer);
            }
            catch (error) {
                this.close();
                this._onError(error);
                reject(error);
            }
        });
    }
    /**
     * Send an event to the Realtime API. This will stringify the event and send it directly to the
     * API. This can be used if you want to take control over the connection and send events manually.
     *
     * @param event - The event to send.
     */
    sendEvent(event) {
        if (!this.#state.dataChannel ||
            this.#state.dataChannel.readyState !== 'open') {
            throw new Error('WebRTC data channel is not connected. Make sure you call `connect()` before sending events.');
        }
        this.#state.dataChannel.send(JSON.stringify(event));
    }
    /**
     * Mute or unmute the session.
     * @param muted - Whether to mute the session.
     */
    mute(muted) {
        this.#muted = muted;
        if (this.#state.peerConnection) {
            const peerConnection = this.#state.peerConnection;
            peerConnection.getSenders().forEach((sender) => {
                if (sender.track) {
                    sender.track.enabled = !muted;
                }
            });
        }
    }
    /**
     * Close the connection to the Realtime API and disconnects the underlying WebRTC connection.
     */
    close() {
        if (this.#state.dataChannel) {
            this.#state.dataChannel.close();
        }
        if (this.#state.peerConnection) {
            const peerConnection = this.#state.peerConnection;
            peerConnection.getSenders().forEach((sender) => {
                sender.track?.stop();
            });
            peerConnection.close();
        }
        if (this.#state.status !== 'disconnected') {
            this.#state = {
                status: 'disconnected',
                peerConnection: undefined,
                dataChannel: undefined,
            };
            this.emit('connection_change', this.#state.status);
            this._onClose();
        }
    }
    /**
     * Interrupt the current response if one is ongoing and clear the audio buffer so that the agent
     * stops talking.
     */
    interrupt() {
        if (this.#ongoingResponse) {
            this.sendEvent({
                type: 'response.cancel',
            });
            this.#ongoingResponse = false;
        }
        this.sendEvent({
            type: 'output_audio_buffer.clear',
        });
    }
}
//# sourceMappingURL=openaiRealtimeWebRtc.js.map