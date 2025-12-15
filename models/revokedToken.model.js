import mongoose from 'mongoose';

const revokedTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// TTL index will remove the document when expiresAt is reached
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);
export default RevokedToken;