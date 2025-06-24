// auth-service.js
import { 
    auth, 
    db, 
    googleProvider, 
    facebookProvider, 
    twitterProvider 
} from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    sendEmailVerification
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
        
        // Lắng nghe thay đổi trạng thái đăng nhập
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }

    // Xử lý thay đổi trạng thái đăng nhập
    handleAuthStateChange(user) {
        if (user) {
            console.log('User đã đăng nhập:', user.email);
            // Chuyển hướng đến trang dashboard hoặc home
            // window.location.href = 'dashboard.html';
        } else {
            console.log('User đã đăng xuất');
        }
    }

    // Đăng ký với email/password
    async registerWithEmail(userData) {
        try {
            this.isLoading = true;
            const { email, password, username, birthday } = userData;

            // Tạo tài khoản với Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Gửi email xác thực
            await sendEmailVerification(user);

            // Cập nhật display name
            await updateProfile(user, {
                displayName: username
            });

            // Lưu thông tin user vào Firestore
            await this.saveUserToFirestore(user, {
                username,
                birthday,
                email,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                provider: 'email'
            });

            this.isLoading = false;
            return {
                success: true,
                user: user,
                message: 'Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác thực tài khoản.'
            };

        } catch (error) {
            this.isLoading = false;
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Đăng nhập với email/password
    async signInWithEmail(credentials) {
        try {
            this.isLoading = true;
            const { email, password, remember } = credentials;

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Kiểm tra xem email đã được xác thực chưa
            if (!user.emailVerified) {
                this.isLoading = false;
                return {
                    success: false,
                    error: 'auth/email-not-verified',
                    message: 'Vui lòng xác thực email của bạn trước khi đăng nhập.'
                };
            }

            // Cập nhật thời gian đăng nhập cuối
            await this.updateLastLogin(user.uid);

            // Xử lý "Ghi nhớ đăng nhập"
            if (remember) {
                localStorage.setItem('rememberUser', 'true');
            } else {
                localStorage.removeItem('rememberUser');
            }

            this.isLoading = false;
            return {
                success: true,
                user: user,
                message: 'Đăng nhập thành công!'
            };

        } catch (error) {
            this.isLoading = false;
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Đăng nhập với Google
    async signInWithGoogle() {
        try {
            this.isLoading = true;
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Kiểm tra xem user đã tồn tại chưa
            const userDoc = await this.getUserFromFirestore(user.uid);
            
            if (!userDoc.exists()) {
                // User mới, lưu thông tin
                await this.saveUserToFirestore(user, {
                    username: user.displayName,
                    email: user.email,
                    avatar: user.photoURL,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    provider: 'google'
                });
            } else {
                // User đã tồn tại, cập nhật thời gian đăng nhập
                await this.updateLastLogin(user.uid);
            }

            this.isLoading = false;
            return {
                success: true,
                user: user,
                message: 'Đăng nhập Google thành công!'
            };

        } catch (error) {
            this.isLoading = false;
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Đăng nhập với Facebook
    async signInWithFacebook() {
        try {
            this.isLoading = true;
            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;

            const userDoc = await this.getUserFromFirestore(user.uid);
            
            if (!userDoc.exists()) {
                await this.saveUserToFirestore(user, {
                    username: user.displayName,
                    email: user.email,
                    avatar: user.photoURL,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    provider: 'facebook'
                });
            } else {
                await this.updateLastLogin(user.uid);
            }

            this.isLoading = false;
            return {
                success: true,
                user: user,
                message: 'Đăng nhập Facebook thành công!'
            };

        } catch (error) {
            this.isLoading = false;
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Đăng nhập với Twitter
    async signInWithTwitter() {
        try {
            this.isLoading = true;
            const result = await signInWithPopup(auth, twitterProvider);
            const user = result.user;

            const userDoc = await this.getUserFromFirestore(user.uid);
            
            if (!userDoc.exists()) {
                await this.saveUserToFirestore(user, {
                    username: user.displayName,
                    email: user.email,
                    avatar: user.photoURL,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    provider: 'twitter'
                });
            } else {
                await this.updateLastLogin(user.uid);
            }

            this.isLoading = false;
            return {
                success: true,
                user: user,
                message: 'Đăng nhập Twitter thành công!'
            };

        } catch (error) {
            this.isLoading = false;
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Đăng xuất
    async signOut() {
        try {
            await signOut(auth);
            localStorage.removeItem('rememberUser');
            return {
                success: true,
                message: 'Đăng xuất thành công!'
            };
        } catch (error) {
            return {
                success: false,
                error: error.code,
                message: 'Có lỗi xảy ra khi đăng xuất'
            };
        }
    }

    // Quên mật khẩu
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return {
                success: true,
                message: 'Email khôi phục mật khẩu đã được gửi!'
            };
        } catch (error) {
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Lưu user vào Firestore
    async saveUserToFirestore(user, additionalData) {
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                ...additionalData
            });
        } catch (error) {
            console.error('Lỗi khi lưu user:', error);
        }
    }

    // Lấy thông tin user từ Firestore
    async getUserFromFirestore(uid) {
        try {
            const userRef = doc(db, 'users', uid);
            return await getDoc(userRef);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin user:', error);
            return null;
        }
    }

    // Cập nhật thời gian đăng nhập cuối
    async updateLastLogin(uid) {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                lastLogin: serverTimestamp()
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật thời gian đăng nhập:', error);
        }
    }

    // Chuyển đổi mã lỗi thành thông báo tiếng Việt
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'Không tìm thấy tài khoản với email này',
            'auth/wrong-password': 'Mật khẩu không chính xác',
            'auth/email-already-in-use': 'Email này đã được sử dụng',
            'auth/weak-password': 'Mật khẩu quá yếu (ít nhất 6 ký tự)',
            'auth/invalid-email': 'Email không hợp lệ',
            'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
            'auth/too-many-requests': 'Quá nhiều yêu cầu, vui lòng thử lại sau',
            'auth/network-request-failed': 'Lỗi kết nối mạng',
            'auth/popup-closed-by-user': 'Cửa sổ đăng nhập đã bị đóng',
            'auth/cancelled-popup-request': 'Yêu cầu đăng nhập đã bị hủy',
            'auth/popup-blocked': 'Popup bị chặn, vui lòng cho phép popup'
        };

        return errorMessages[errorCode] || 'Có lỗi xảy ra, vui lòng thử lại';
    }

    // Kiểm tra trạng thái đăng nhập
    getCurrentUser() {
        return this.currentUser;
    }

    // Kiểm tra xem user có đang đăng nhập không
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Export instance duy nhất
export const authService = new AuthService();