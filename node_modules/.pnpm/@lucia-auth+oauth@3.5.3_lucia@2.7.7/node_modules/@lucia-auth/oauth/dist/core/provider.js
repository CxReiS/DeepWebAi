export class ProviderUserAuth {
    auth;
    providerId;
    providerUserId;
    constructor(auth, providerId, providerUserId) {
        this.auth = auth;
        this.providerId = providerId;
        this.providerUserId = providerUserId;
    }
    getExistingUser = async () => {
        try {
            const key = await this.auth.useKey(this.providerId, this.providerUserId, null);
            const user = await this.auth.getUser(key.userId);
            return user;
        }
        catch (e) {
            const error = e;
            if (error?.message !== "AUTH_INVALID_KEY_ID")
                throw e;
            return null;
        }
    };
    createKey = async (userId) => {
        return await this.auth.createKey({
            userId,
            providerId: this.providerId,
            providerUserId: this.providerUserId,
            password: null
        });
    };
    createUser = async (options) => {
        const user = await this.auth.createUser({
            key: {
                providerId: this.providerId,
                providerUserId: this.providerUserId,
                password: null
            },
            ...options
        });
        return user;
    };
}
export const providerUserAuth = (auth, providerId, providerUserId) => {
    return new ProviderUserAuth(auth, providerId, providerUserId);
};
