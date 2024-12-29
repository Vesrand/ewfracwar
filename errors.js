class AuthFailError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuthFailError";
    }
}

exports.AuthFailError = AuthFailError;