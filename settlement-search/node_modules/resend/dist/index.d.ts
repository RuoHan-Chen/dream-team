import * as React from 'react';

interface GetOptions {
    query?: Record<string, unknown>;
}

interface PostOptions {
    query?: {
        [key: string]: unknown;
    };
}

interface PutOptions {
    query?: {
        [key: string]: unknown;
    };
}

declare const RESEND_ERROR_CODES_BY_KEY: {
    readonly missing_required_field: 422;
    readonly invalid_idempotency_key: 400;
    readonly invalid_idempotent_request: 409;
    readonly concurrent_idempotent_requests: 409;
    readonly invalid_access: 422;
    readonly invalid_parameter: 422;
    readonly invalid_region: 422;
    readonly rate_limit_exceeded: 429;
    readonly missing_api_key: 401;
    readonly invalid_api_Key: 403;
    readonly invalid_from_address: 403;
    readonly validation_error: 403;
    readonly not_found: 404;
    readonly method_not_allowed: 405;
    readonly application_error: 500;
    readonly internal_server_error: 500;
};
type RESEND_ERROR_CODE_KEY = keyof typeof RESEND_ERROR_CODES_BY_KEY;
interface ErrorResponse {
    message: string;
    name: RESEND_ERROR_CODE_KEY;
}

interface CreateApiKeyOptions {
    name: string;
    permission?: 'full_access' | 'sending_access';
    domain_id?: string;
}
interface CreateApiKeyRequestOptions extends PostOptions {
}
interface CreateApiKeyResponseSuccess {
    token: string;
    id: string;
}
interface CreateApiKeyResponse {
    data: CreateApiKeyResponseSuccess | null;
    error: ErrorResponse | null;
}

interface ApiKey {
    created_at: string;
    id: string;
    name: string;
}

type ListApiKeysResponseSuccess = Pick<ApiKey, 'name' | 'id' | 'created_at'>[];
interface ListApiKeysResponse {
    data: ListApiKeysResponseSuccess | null;
    error: ErrorResponse | null;
}

type RemoveApiKeyResponseSuccess = {};
interface RemoveApiKeyResponse {
    data: RemoveApiKeyResponseSuccess | null;
    error: ErrorResponse | null;
}

declare class ApiKeys {
    private readonly resend;
    constructor(resend: Resend);
    create(payload: CreateApiKeyOptions, options?: CreateApiKeyRequestOptions): Promise<CreateApiKeyResponse>;
    list(): Promise<ListApiKeysResponse>;
    remove(id: string): Promise<RemoveApiKeyResponse>;
}

interface Audience {
    created_at: string;
    id: string;
    name: string;
}

interface CreateAudienceOptions {
    name: string;
}
interface CreateAudienceRequestOptions extends PostOptions {
}
interface CreateAudienceResponseSuccess extends Pick<Audience, 'name' | 'id'> {
    object: 'audience';
}
interface CreateAudienceResponse {
    data: CreateAudienceResponseSuccess | null;
    error: ErrorResponse | null;
}

interface GetAudienceResponseSuccess extends Pick<Audience, 'id' | 'name' | 'created_at'> {
    object: 'audience';
}
interface GetAudienceResponse {
    data: GetAudienceResponseSuccess | null;
    error: ErrorResponse | null;
}

type ListAudiencesResponseSuccess = {
    object: 'list';
    data: Audience[];
};
interface ListAudiencesResponse {
    data: ListAudiencesResponseSuccess | null;
    error: ErrorResponse | null;
}

interface RemoveAudiencesResponseSuccess extends Pick<Audience, 'id'> {
    object: 'audience';
    deleted: boolean;
}
interface RemoveAudiencesResponse {
    data: RemoveAudiencesResponseSuccess | null;
    error: ErrorResponse | null;
}

declare class Audiences {
    private readonly resend;
    constructor(resend: Resend);
    create(payload: CreateAudienceOptions, options?: CreateAudienceRequestOptions): Promise<CreateAudienceResponse>;
    list(): Promise<ListAudiencesResponse>;
    get(id: string): Promise<GetAudienceResponse>;
    remove(id: string): Promise<RemoveAudiencesResponse>;
}

interface IdempotentRequest {
    /**
     * Unique key that ensures the same operation is not processed multiple times.
     * Allows for safe retries without duplicating operations.
     * If provided, will be sent as the `Idempotency-Key` header.
     */
    idempotencyKey?: string;
}

type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

interface EmailRenderOptions$1 {
    /**
     * The React component used to write the message.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    react: React.ReactNode;
    /**
     * The HTML version of the message.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    html: string;
    /**
     * The plain text version of the message.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    text: string;
}
interface CreateEmailBaseOptions {
    /**
     * Filename and content of attachments (max 40mb per email)
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    attachments?: Attachment[];
    /**
     * Blind carbon copy recipient email address. For multiple addresses, send as an array of strings.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    bcc?: string | string[];
    /**
     * Carbon copy recipient email address. For multiple addresses, send as an array of strings.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    cc?: string | string[];
    /**
     * Sender email address. To include a friendly name, use the format `"Your Name <sender@domain.com>"`
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    from: string;
    /**
     * Custom headers to add to the email.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    headers?: Record<string, string>;
    /**
     * Reply-to email address. For multiple addresses, send as an array of strings.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    replyTo?: string | string[];
    /**
     * Email subject.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    subject: string;
    /**
     * Email tags
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    tags?: Tag[];
    /**
     * Recipient email address. For multiple addresses, send as an array of strings. Max 50.
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    to: string | string[];
    /**
     * Schedule email to be sent later.
     * The date should be in ISO 8601 format (e.g: 2024-08-05T11:52:01.858Z).
     *
     * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
     */
    scheduledAt?: string;
}
type CreateEmailOptions = RequireAtLeastOne<EmailRenderOptions$1> & CreateEmailBaseOptions;
interface CreateEmailRequestOptions extends PostOptions, IdempotentRequest {
}
interface CreateEmailResponseSuccess {
    /** The ID of the newly created email. */
    id: string;
}
interface CreateEmailResponse {
    data: CreateEmailResponseSuccess | null;
    error: ErrorResponse | null;
}
interface Attachment {
    /** Content of an attached file. */
    content?: string | Buffer;
    /** Name of attached file. */
    filename?: string | false | undefined;
    /** Path where the attachment file is hosted */
    path?: string;
    /** Optional content type for the attachment, if not set will be derived from the filename property */
    contentType?: string;
}
type Tag = {
    /**
     * The name of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
     */
    name: string;
    /**
     * The value of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
     */
    value: string;
};

type CreateBatchOptions = CreateEmailOptions[];
interface CreateBatchRequestOptions extends PostOptions, IdempotentRequest {
}
interface CreateBatchSuccessResponse {
    data: {
        /** The ID of the newly created email. */
        id: string;
    }[];
}
interface CreateBatchResponse {
    data: CreateBatchSuccessResponse | null;
    error: ErrorResponse | null;
}

declare class Batch {
    private readonly resend;
    private renderAsync?;
    constructor(resend: Resend);
    send(payload: CreateBatchOptions, options?: CreateBatchRequestOptions): Promise<CreateBatchResponse>;
    create(payload: CreateBatchOptions, options?: CreateBatchRequestOptions): Promise<CreateBatchResponse>;
}

interface EmailRenderOptions {
    /**
     * The React component used to write the message.
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    react: React.ReactNode;
    /**
     * The HTML version of the message.
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    html: string;
    /**
     * The plain text version of the message.
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    text: string;
}
interface CreateBroadcastBaseOptions {
    /**
     * The name of the broadcast
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    name?: string;
    /**
     * The id of the audience you want to send to
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    audienceId: string;
    /**
     * A short snippet of text displayed as a preview in recipients' inboxes, often shown below or beside the subject line.
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    previewText?: string;
    /**
     * Sender email address. To include a friendly name, use the format `"Your Name <sender@domain.com>"`
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    from: string;
    /**
     * Reply-to email address. For multiple addresses, send as an array of strings.
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    replyTo?: string | string[];
    /**
     * Email subject.
     *
     * @link https://resend.com/docs/api-reference/broadcasts/create#body-parameters
     */
    subject: string;
}
type CreateBroadcastOptions = RequireAtLeastOne<EmailRenderOptions> & CreateBroadcastBaseOptions;
interface CreateBroadcastRequestOptions extends PostOptions {
}
interface CreateBroadcastResponseSuccess {
    /** The ID of the newly sent broadcasts. */
    id: string;
}
interface CreateBroadcastResponse {
    data: CreateBroadcastResponseSuccess | null;
    error: ErrorResponse | null;
}

interface Broadcast {
    id: string;
    name: string;
    audience_id: string | null;
    from: string | null;
    subject: string | null;
    reply_to: string[] | null;
    preview_text: string | null;
    status: 'draft' | 'sent' | 'queued';
    created_at: string;
    scheduled_at: string | null;
    sent_at: string | null;
}

interface GetBroadcastResponseSuccess extends Broadcast {
    object: 'broadcast';
}
interface GetBroadcastResponse {
    data: GetBroadcastResponseSuccess | null;
    error: ErrorResponse | null;
}

type ListBroadcastsResponseSuccess = {
    object: 'list';
    data: Pick<Broadcast, 'id' | 'name' | 'audience_id' | 'status' | 'created_at' | 'scheduled_at' | 'sent_at'>[];
};
interface ListBroadcastsResponse {
    data: ListBroadcastsResponseSuccess | null;
    error: ErrorResponse | null;
}

interface RemoveBroadcastResponseSuccess extends Pick<Broadcast, 'id'> {
    object: 'broadcast';
    deleted: boolean;
}
interface RemoveBroadcastResponse {
    data: RemoveBroadcastResponseSuccess | null;
    error: ErrorResponse | null;
}

interface SendBroadcastBaseOptions {
    /**
     * Schedule email to be sent later.
     * The date should be in ISO 8601 format (e.g: 2024-08-05T11:52:01.858Z)
     * or relative time (eg: in 2 days).
     *
     * @link https://resend.com/docs/api-reference/broadcasts/send#body-parameters
     */
    scheduledAt?: string;
}
type SendBroadcastOptions = SendBroadcastBaseOptions;
interface SendBroadcastRequestOptions extends PostOptions {
}
interface SendBroadcastResponseSuccess {
    /** The ID of the sent broadcast. */
    id: string;
}
interface SendBroadcastResponse {
    data: SendBroadcastResponseSuccess | null;
    error: ErrorResponse | null;
}

interface UpdateBroadcastResponseSuccess {
    id: string;
}
interface UpdateBroadcastOptions {
    name?: string;
    audienceId?: string;
    from?: string;
    html?: string;
    text?: string;
    subject?: string;
    replyTo?: string[];
    previewText?: string;
}
interface UpdateBroadcastResponse {
    data: UpdateBroadcastResponseSuccess | null;
    error: ErrorResponse | null;
}

declare class Broadcasts {
    private readonly resend;
    private renderAsync?;
    constructor(resend: Resend);
    create(payload: CreateBroadcastOptions, options?: CreateBroadcastRequestOptions): Promise<SendBroadcastResponse>;
    send(id: string, payload?: SendBroadcastOptions): Promise<SendBroadcastResponse>;
    list(): Promise<ListBroadcastsResponse>;
    get(id: string): Promise<GetBroadcastResponse>;
    remove(id: string): Promise<RemoveBroadcastResponse>;
    update(id: string, payload: UpdateBroadcastOptions): Promise<UpdateBroadcastResponse>;
}

interface PatchOptions {
    query?: {
        [key: string]: unknown;
    };
}

interface Contact {
    created_at: string;
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    unsubscribed: boolean;
}

interface CreateContactOptions {
    audienceId: string;
    email: string;
    unsubscribed?: boolean;
    firstName?: string;
    lastName?: string;
}
interface CreateContactRequestOptions extends PostOptions {
}
interface CreateContactResponseSuccess extends Pick<Contact, 'id'> {
    object: 'contact';
}
interface CreateContactResponse {
    data: CreateContactResponseSuccess | null;
    error: ErrorResponse | null;
}

interface GetContactOptions {
    audienceId: string;
    id?: string;
    email?: string;
}
interface GetContactResponseSuccess extends Pick<Contact, 'id' | 'email' | 'created_at' | 'first_name' | 'last_name' | 'unsubscribed'> {
    object: 'contact';
}
interface GetContactResponse {
    data: GetContactResponseSuccess | null;
    error: ErrorResponse | null;
}

interface ListContactsOptions {
    audienceId: string;
}
interface ListContactsResponseSuccess {
    object: 'list';
    data: Contact[];
}
interface ListContactsResponse {
    data: ListContactsResponseSuccess | null;
    error: ErrorResponse | null;
}

type RemoveContactsResponseSuccess = {
    object: 'contact';
    deleted: boolean;
    contact: string;
};
interface RemoveByOptions {
    /**
     * The contact id.
     *
     * @link https://resend.com/docs/api-reference/contacts/delete-contact#body-parameters
     */
    id?: string;
    /**
     * The contact email.
     *
     * @link https://resend.com/docs/api-reference/contacts/delete-contact#body-parameters
     */
    email?: string;
}
interface RemoveContactOptions extends RemoveByOptions {
    audienceId: string;
}
interface RemoveContactsResponse {
    data: RemoveContactsResponseSuccess | null;
    error: ErrorResponse | null;
}

interface UpdateContactBaseOptions {
    id?: string;
    email?: string;
}
interface UpdateContactOptions extends UpdateContactBaseOptions {
    audienceId: string;
    unsubscribed?: boolean;
    firstName?: string;
    lastName?: string;
}
type UpdateContactResponseSuccess = Pick<Contact, 'id'> & {
    object: 'contact';
};
interface UpdateContactResponse {
    data: UpdateContactResponseSuccess | null;
    error: ErrorResponse | null;
}

declare class Contacts {
    private readonly resend;
    constructor(resend: Resend);
    create(payload: CreateContactOptions, options?: CreateContactRequestOptions): Promise<CreateContactResponse>;
    list(options: ListContactsOptions): Promise<ListContactsResponse>;
    get(options: GetContactOptions): Promise<GetContactResponse>;
    update(payload: UpdateContactOptions): Promise<UpdateContactResponse>;
    remove(payload: RemoveContactOptions): Promise<RemoveContactsResponse>;
}

type DomainRegion = 'us-east-1' | 'eu-west-1' | 'sa-east-1' | 'ap-northeast-1';
type DomainStatus = 'pending' | 'verified' | 'failed' | 'temporary_failure' | 'not_started';
type DomainRecords = DomainSpfRecord | DomainDkimRecord;
interface DomainSpfRecord {
    record: 'SPF';
    name: string;
    value: string;
    type: 'MX' | 'TXT';
    ttl: string;
    status: DomainStatus;
    routing_policy?: string;
    priority?: number;
    proxy_status?: 'enable' | 'disable';
}
interface DomainDkimRecord {
    record: 'DKIM';
    name: string;
    value: string;
    type: 'CNAME' | 'TXT';
    ttl: string;
    status: DomainStatus;
    routing_policy?: string;
    priority?: number;
    proxy_status?: 'enable' | 'disable';
}
interface Domain {
    id: string;
    name: string;
    status: DomainStatus;
    created_at: string;
    region: DomainRegion;
}

interface CreateDomainOptions {
    name: string;
    region?: DomainRegion;
    customReturnPath?: string;
}
interface CreateDomainRequestOptions extends PostOptions {
}
interface CreateDomainResponseSuccess extends Pick<Domain, 'name' | 'id' | 'status' | 'created_at' | 'region'> {
    records: DomainRecords[];
}
interface CreateDomainResponse {
    data: CreateDomainResponseSuccess | null;
    error: ErrorResponse | null;
}

interface GetDomainResponseSuccess extends Pick<Domain, 'id' | 'name' | 'created_at' | 'region' | 'status'> {
    object: 'domain';
    records: DomainRecords[];
}
interface GetDomainResponse {
    data: GetDomainResponseSuccess | null;
    error: ErrorResponse | null;
}

type ListDomainsResponseSuccess = {
    data: Domain[];
};
interface ListDomainsResponse {
    data: ListDomainsResponseSuccess | null;
    error: ErrorResponse | null;
}

type RemoveDomainsResponseSuccess = Pick<Domain, 'id'> & {
    object: 'domain';
    deleted: boolean;
};
interface RemoveDomainsResponse {
    data: RemoveDomainsResponseSuccess | null;
    error: ErrorResponse | null;
}

interface UpdateDomainsOptions {
    id: string;
    clickTracking?: boolean;
    openTracking?: boolean;
    tls?: 'enforced' | 'opportunistic';
}
type UpdateDomainsResponseSuccess = Pick<Domain, 'id'> & {
    object: 'domain';
};
interface UpdateDomainsResponse {
    data: UpdateDomainsResponseSuccess | null;
    error: ErrorResponse | null;
}

type VerifyDomainsResponseSuccess = Pick<Domain, 'id'> & {
    object: 'domain';
};
interface VerifyDomainsResponse {
    data: VerifyDomainsResponseSuccess | null;
    error: ErrorResponse | null;
}

declare class Domains {
    private readonly resend;
    constructor(resend: Resend);
    create(payload: CreateDomainOptions, options?: CreateDomainRequestOptions): Promise<CreateDomainResponse>;
    list(): Promise<ListDomainsResponse>;
    get(id: string): Promise<GetDomainResponse>;
    update(payload: UpdateDomainsOptions): Promise<UpdateDomainsResponse>;
    remove(id: string): Promise<RemoveDomainsResponse>;
    verify(id: string): Promise<VerifyDomainsResponse>;
}

interface CancelEmailResponse {
    data: CancelEmailResponseSuccess | null;
    error: ErrorResponse | null;
}
interface CancelEmailResponseSuccess {
    object: 'email';
    id: string;
}

interface GetEmailResponseSuccess {
    bcc: string[] | null;
    cc: string[] | null;
    created_at: string;
    from: string;
    html: string | null;
    id: string;
    last_event: 'bounced' | 'canceled' | 'clicked' | 'complained' | 'delivered' | 'delivery_delayed' | 'failed' | 'opened' | 'queued' | 'scheduled' | 'sent';
    reply_to: string[] | null;
    subject: string;
    text: string | null;
    to: string[];
    scheduled_at: string | null;
    object: 'email';
}
interface GetEmailResponse {
    data: GetEmailResponseSuccess | null;
    error: ErrorResponse | null;
}

interface UpdateEmailOptions {
    id: string;
    scheduledAt: string;
}
interface UpdateEmailResponseSuccess {
    id: string;
    object: 'email';
}
interface UpdateEmailResponse {
    data: UpdateEmailResponseSuccess | null;
    error: ErrorResponse | null;
}

declare class Emails {
    private readonly resend;
    private renderAsync?;
    constructor(resend: Resend);
    send(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse>;
    create(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse>;
    get(id: string): Promise<GetEmailResponse>;
    update(payload: UpdateEmailOptions): Promise<UpdateEmailResponse>;
    cancel(id: string): Promise<CancelEmailResponse>;
}

declare class Resend {
    readonly key?: string | undefined;
    private readonly headers;
    readonly apiKeys: ApiKeys;
    readonly audiences: Audiences;
    readonly batch: Batch;
    readonly broadcasts: Broadcasts;
    readonly contacts: Contacts;
    readonly domains: Domains;
    readonly emails: Emails;
    constructor(key?: string | undefined);
    fetchRequest<T>(path: string, options?: {}): Promise<{
        data: T | null;
        error: ErrorResponse | null;
    }>;
    post<T>(path: string, entity?: unknown, options?: PostOptions & IdempotentRequest): Promise<{
        data: T | null;
        error: ErrorResponse | null;
    }>;
    get<T>(path: string, options?: GetOptions): Promise<{
        data: T | null;
        error: ErrorResponse | null;
    }>;
    put<T>(path: string, entity: unknown, options?: PutOptions): Promise<{
        data: T | null;
        error: ErrorResponse | null;
    }>;
    patch<T>(path: string, entity: unknown, options?: PatchOptions): Promise<{
        data: T | null;
        error: ErrorResponse | null;
    }>;
    delete<T>(path: string, query?: unknown): Promise<{
        data: T | null;
        error: ErrorResponse | null;
    }>;
}

export { Attachment, CreateApiKeyOptions, CreateApiKeyRequestOptions, CreateApiKeyResponse, CreateApiKeyResponseSuccess, CreateAudienceOptions, CreateAudienceRequestOptions, CreateAudienceResponse, CreateAudienceResponseSuccess, CreateBatchOptions, CreateBatchRequestOptions, CreateBatchResponse, CreateBatchSuccessResponse, CreateBroadcastOptions, CreateBroadcastRequestOptions, CreateBroadcastResponse, CreateBroadcastResponseSuccess, CreateContactOptions, CreateContactRequestOptions, CreateContactResponse, CreateContactResponseSuccess, CreateDomainOptions, CreateDomainRequestOptions, CreateDomainResponse, CreateDomainResponseSuccess, CreateEmailOptions, CreateEmailRequestOptions, CreateEmailResponse, CreateEmailResponseSuccess, ErrorResponse, GetAudienceResponse, GetAudienceResponseSuccess, GetContactOptions, GetContactResponse, GetContactResponseSuccess, GetDomainResponse, GetDomainResponseSuccess, GetEmailResponse, GetEmailResponseSuccess, ListApiKeysResponse, ListApiKeysResponseSuccess, ListAudiencesResponse, ListAudiencesResponseSuccess, ListContactsOptions, ListContactsResponse, ListContactsResponseSuccess, ListDomainsResponse, ListDomainsResponseSuccess, RemoveApiKeyResponse, RemoveApiKeyResponseSuccess, RemoveAudiencesResponse, RemoveAudiencesResponseSuccess, RemoveContactOptions, RemoveContactsResponse, RemoveContactsResponseSuccess, RemoveDomainsResponse, RemoveDomainsResponseSuccess, Resend, SendBroadcastOptions, SendBroadcastRequestOptions, SendBroadcastResponse, SendBroadcastResponseSuccess, Tag, UpdateContactOptions, UpdateContactResponse, UpdateContactResponseSuccess, UpdateDomainsOptions, UpdateDomainsResponse, UpdateDomainsResponseSuccess, VerifyDomainsResponse, VerifyDomainsResponseSuccess };
