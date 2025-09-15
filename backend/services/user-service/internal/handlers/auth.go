package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"time"
	"user-service/internal/database"
	"user-service/internal/models"
	"user-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Register handles user registration
func Register(c *gin.Context) {
	var req models.UserRegistration
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()

	// Check if email already exists
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Check if username already exists
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", req.Username).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	userID := uuid.New()
	storageLimitMB := models.GetStorageLimit(models.TierFree)
	
	query := `
		INSERT INTO users (id, email, username, password_hash, first_name, last_name, 
						  subscription_tier, storage_limit_mb, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, email, username, created_at`

	var user models.User
	err = db.QueryRow(query, 
		userID, req.Email, req.Username, hashedPassword, 
		sql.NullString{String: req.FirstName, Valid: req.FirstName != ""},
		sql.NullString{String: req.LastName, Valid: req.LastName != ""},
		models.TierFree, storageLimitMB, time.Now(), time.Now(),
	).Scan(&user.ID, &user.Email, &user.Username, &user.CreatedAt)

	if err != nil {
		log.Printf("Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := utils.GenerateTokens(user.ID, user.Email, user.Username, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	// Save refresh token
	_, err = db.Exec(`
		INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)`,
		user.ID, refreshToken, time.Now().Add(7*24*time.Hour),
		c.ClientIP(), c.Request.UserAgent(),
	)
	if err != nil {
		log.Printf("Failed to save refresh token: %v", err)
	}

	c.JSON(http.StatusCreated, models.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    900, // 15 minutes in seconds
		User:         &user,
	})
}

// Login handles user login
func Login(c *gin.Context) {
	var req models.UserLogin
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()

	// Find user by email
	var user models.User
	err := db.QueryRow(`
		SELECT id, email, username, password_hash, subscription_tier, is_active
		FROM users WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.SubscriptionTier, &user.IsActive)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Check if account is active
	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is disabled"})
		return
	}

	// Verify password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Update last login
	_, err = db.Exec("UPDATE users SET last_login_at = $1 WHERE id = $2", time.Now(), user.ID)
	if err != nil {
		log.Printf("Failed to update last login: %v", err)
	}

	// Generate tokens
	accessToken, refreshToken, err := utils.GenerateTokens(user.ID, user.Email, user.Username, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	// Save refresh token
	_, err = db.Exec(`
		INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)`,
		user.ID, refreshToken, time.Now().Add(7*24*time.Hour),
		c.ClientIP(), c.Request.UserAgent(),
	)
	if err != nil {
		log.Printf("Failed to save refresh token: %v", err)
	}

	// Clear password hash before sending response
	user.PasswordHash = ""

	c.JSON(http.StatusOK, models.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    900,
		User:         &user,
	})
}

// RefreshToken handles token refresh
func RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate refresh token
	claims, err := utils.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	db := database.GetDB()

	// Check if refresh token exists and is not revoked
	var isRevoked bool
	err = db.QueryRow(`
		SELECT is_revoked FROM refresh_tokens 
		WHERE token = $1 AND user_id = $2`,
		req.RefreshToken, claims.UserID,
	).Scan(&isRevoked)

	if err != nil || isRevoked {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Get user info
	var user models.User
	err = db.QueryRow(`
		SELECT id, email, username, subscription_tier 
		FROM users WHERE id = $1`,
		claims.UserID,
	).Scan(&user.ID, &user.Email, &user.Username, &user.SubscriptionTier)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Generate new tokens
	accessToken, newRefreshToken, err := utils.GenerateTokens(user.ID, user.Email, user.Username, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	// Revoke old refresh token
	_, _ = db.Exec(`
		UPDATE refresh_tokens SET is_revoked = true, revoked_at = $1 
		WHERE token = $2`,
		time.Now(), req.RefreshToken,
	)

	// Save new refresh token
	_, err = db.Exec(`
		INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)`,
		user.ID, newRefreshToken, time.Now().Add(7*24*time.Hour),
		c.ClientIP(), c.Request.UserAgent(),
	)

	c.JSON(http.StatusOK, models.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    900,
	})
}

// Logout handles user logout
func Logout(c *gin.Context) {
	userID := c.GetString("user_id")
	
	// Revoke all refresh tokens for this user
	db := database.GetDB()
	_, err := db.Exec(`
		UPDATE refresh_tokens 
		SET is_revoked = true, revoked_at = $1 
		WHERE user_id = $2 AND is_revoked = false`,
		time.Now(), userID,
	)

	if err != nil {
		log.Printf("Failed to revoke tokens: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Placeholder functions for additional auth endpoints
func VerifyEmail(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Email verification not implemented yet"})
}

func ForgotPassword(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Password reset not implemented yet"})
}

func ResetPassword(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Password reset not implemented yet"})
}