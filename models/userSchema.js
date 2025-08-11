import {Schema, model} from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new Schema({
  fullName: {
    type: String,
    required: [true,'name is required'],
    minLength: [5,'Name must be at least 5 characters long'],
    maxLength: [50,'Name must be at most 50 characters long'],
    trim: true
  },
    email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please fill a valid email address']
    },
    password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters long'],
    // maxLength: [80, 'Password must be at most 20 characters long'],
    select: false // Do not return password by default
    },
    avatar: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String,
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'ADMIN'],
        default: 'user'
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordExpiry: {
        type: Date,
    },
   subscription: {
  id: {
    type: String,
  },
  status: {
    type: String,
  }
}

},
{
    timestamps: true
}
);
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
userSchema.methods = {
    generateJWTToken: async function () {
        return await jwt.sign(
            { id: this._id, email: this.email, subscription: this.subscription, role: this.role },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY
            }
        );
    },

comparePassword: async function(plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
},

generatePasswordResetToken: async function() {

    const resetToken = crypto.randomBytes(32).toString('hex');
    this.forgotPasswordToken = crypto.createHash('sha256')
    .update(resetToken)
    .digest('hex');

    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes

return resetToken;
}

}




const User = model('User', userSchema);

export default User;