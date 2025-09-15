package models

import (
	"database/sql/driver"
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	Email                string     `json:"email" db:"email"`
	Username             string     `json:"username" db:"username"`
	PasswordHash         string     `json:"-" db:"password_hash"`
	FirstName            *string    `json:"first_name,omitempty" db:"first_name"`
	LastName             *string    `json:"last_name,omitempty" db:"last_name"`
	AvatarURL            *string    `json:"avatar_url,omitempty" db:"avatar_url"`
	Bio                  *string    `json:"bio,omitempty" db:"bio"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
	EmailVerified        bool       `json:"email_verified" db:"email_verified"`
	EmailVerifiedAt      *time.Time `json:"email_verified_at,omitempty" db:"email_verified_at"`
	LastLoginAt          *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	IsActive             bool       `json:"is_active" db:"is_active"`
	SubscriptionTier     string     `json:"subscription_tier" db:"subscription_tier"`
	SubscriptionExpiresAt *time.Time `json:"subscription_expires_at,omitempty" db:"subscription_expires_at"`
	StorageUsedMB        int        `json:"storage_used_mb" db:"storage_used_mb"`
	StorageLimitMB       int        `json:"storage_limit_mb" db:"storage_limit_mb"`
	Preferences          JSONB      `json:"preferences" db:"preferences"`
	Metadata             JSONB      `json:"metadata" db:"metadata"`
}

// RefreshToken represents a refresh token
type RefreshToken struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Token     string     `json:"token" db:"token"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty" db:"revoked_at"`
	IPAddress *string    `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent *string    `json:"user_agent,omitempty" db:"user_agent"`
	IsRevoked bool       `json:"is_revoked" db:"is_revoked"`
}

// JSONB represents a JSONB database type
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface
func (j JSONB) Value() (driver.Value, error) {
	return j, nil
}

// Scan implements the sql.Scanner interface
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSONB)
		return nil
	}
	*j = value.(JSONB)
	return nil
}

// UserRegistration represents the registration request
type UserRegistration struct {
	Email     string `json:"email" binding:"required,email"`
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
}

// UserLogin represents the login request
type UserLogin struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UserUpdate represents the user update request
type UserUpdate struct {
	Username  *string `json:"username,omitempty" binding:"omitempty,min=3,max=50"`
	FirstName *string `json:"first_name,omitempty"`
	LastName  *string `json:"last_name,omitempty"`
	Bio       *string `json:"bio,omitempty" binding:"omitempty,max=500"`
	AvatarURL *string `json:"avatar_url,omitempty" binding:"omitempty,url"`
}

// PasswordChange represents a password change request
type PasswordChange struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// TokenResponse represents the authentication token response
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	User         *User  `json:"user,omitempty"`
}

// RefreshTokenRequest represents a token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// EmailVerification represents email verification request
type EmailVerification struct {
	Token string `json:"token" binding:"required"`
}

// ForgotPasswordRequest represents a password reset request
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents a password reset with token
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// SubscriptionTier enum
const (
	TierFree         = "free"
	TierHobbyist     = "hobbyist"
	TierProfessional = "professional"
	TierMaster       = "master"
	TierEnterprise   = "enterprise"
)

// GetStorageLimit returns the storage limit based on subscription tier
func GetStorageLimit(tier string) int {
	switch tier {
	case TierFree:
		return 100 // 100 MB
	case TierHobbyist:
		return 1000 // 1 GB
	case TierProfessional:
		return 5000 // 5 GB
	case TierMaster:
		return 20000 // 20 GB
	case TierEnterprise:
		return 999999 // Unlimited
	default:
		return 100
	}
}

// UserProfile represents the public user profile
type UserProfile struct {
	ID               uuid.UUID `json:"id"`
	Username         string    `json:"username"`
	FirstName        *string   `json:"first_name,omitempty"`
	LastName         *string   `json:"last_name,omitempty"`
	AvatarURL        *string   `json:"avatar_url,omitempty"`
	Bio              *string   `json:"bio,omitempty"`
	SubscriptionTier string    `json:"subscription_tier"`
	JoinedAt         time.Time `json:"joined_at"`
}

// ToProfile converts a User to a UserProfile (public view)
func (u *User) ToProfile() *UserProfile {
	return &UserProfile{
		ID:               u.ID,
		Username:         u.Username,
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		AvatarURL:        u.AvatarURL,
		Bio:              u.Bio,
		SubscriptionTier: u.SubscriptionTier,
		JoinedAt:         u.CreatedAt,
	}
}