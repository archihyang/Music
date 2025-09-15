package handlers

import (
	"database/sql"
	"net/http"
	"user-service/internal/database"
	"user-service/internal/models"
	"user-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetProfile gets the current user's profile
func GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	db := database.GetDB()
	var user models.User

	err := db.QueryRow(`
		SELECT id, email, username, first_name, last_name, avatar_url, bio,
			   subscription_tier, storage_used_mb, storage_limit_mb, created_at
		FROM users WHERE id = $1`,
		userID,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.FirstName, &user.LastName,
		&user.AvatarURL, &user.Bio, &user.SubscriptionTier,
		&user.StorageUsedMB, &user.StorageLimitMB, &user.CreatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile updates the current user's profile
func UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.UserUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()

	// Build dynamic update query
	query := "UPDATE users SET updated_at = NOW()"
	args := []interface{}{}
	argCount := 1

	if req.Username != nil {
		// Check if username already exists
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1 AND id != $2)", 
			*req.Username, userID).Scan(&exists)
		if err != nil || exists {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
			return
		}
		query += ", username = $" + string(rune('0'+argCount))
		args = append(args, *req.Username)
		argCount++
	}

	if req.FirstName != nil {
		query += ", first_name = $" + string(rune('0'+argCount))
		args = append(args, *req.FirstName)
		argCount++
	}

	if req.LastName != nil {
		query += ", last_name = $" + string(rune('0'+argCount))
		args = append(args, *req.LastName)
		argCount++
	}

	if req.Bio != nil {
		query += ", bio = $" + string(rune('0'+argCount))
		args = append(args, *req.Bio)
		argCount++
	}

	if req.AvatarURL != nil {
		query += ", avatar_url = $" + string(rune('0'+argCount))
		args = append(args, *req.AvatarURL)
		argCount++
	}

	query += " WHERE id = $" + string(rune('0'+argCount))
	args = append(args, userID)

	_, err := db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// DeleteAccount deletes the current user's account
func DeleteAccount(c *gin.Context) {
	userID := c.GetString("user_id")

	db := database.GetDB()
	
	// Soft delete - just mark as inactive
	_, err := db.Exec("UPDATE users SET is_active = false WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}

// ChangePassword changes the user's password
func ChangePassword(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.PasswordChange
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()

	// Get current password hash
	var currentHash string
	err := db.QueryRow("SELECT password_hash FROM users WHERE id = $1", userID).Scan(&currentHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	if !utils.CheckPasswordHash(req.CurrentPassword, currentHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update password
	_, err = db.Exec("UPDATE users SET password_hash = $1 WHERE id = $2", newHash, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// GetSubscription gets the user's subscription details
func GetSubscription(c *gin.Context) {
	userID := c.GetString("user_id")

	db := database.GetDB()
	var sub struct {
		Tier         string         `json:"tier"`
		ExpiresAt    sql.NullTime  `json:"expires_at"`
		StorageUsed  int           `json:"storage_used_mb"`
		StorageLimit int           `json:"storage_limit_mb"`
	}

	err := db.QueryRow(`
		SELECT subscription_tier, subscription_expires_at, storage_used_mb, storage_limit_mb
		FROM users WHERE id = $1`,
		userID,
	).Scan(&sub.Tier, &sub.ExpiresAt, &sub.StorageUsed, &sub.StorageLimit)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get subscription"})
		return
	}

	c.JSON(http.StatusOK, sub)
}

// UpgradeSubscription upgrades the user's subscription (placeholder)
func UpgradeSubscription(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Subscription upgrade not implemented yet"})
}

// Admin handlers
func ListUsers(c *gin.Context) {
	db := database.GetDB()
	
	rows, err := db.Query(`
		SELECT id, email, username, subscription_tier, created_at, is_active
		FROM users
		ORDER BY created_at DESC
		LIMIT 100
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}
	defer rows.Close()

	var users []models.UserProfile
	for rows.Next() {
		var user models.User
		err := rows.Scan(&user.ID, &user.Email, &user.Username, 
			&user.SubscriptionTier, &user.CreatedAt, &user.IsActive)
		if err != nil {
			continue
		}
		users = append(users, *user.ToProfile())
	}

	c.JSON(http.StatusOK, users)
}

func GetUserByID(c *gin.Context) {
	userID := c.Param("id")
	
	// Validate UUID
	_, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	db := database.GetDB()
	var user models.User

	err = db.QueryRow(`
		SELECT id, email, username, first_name, last_name, 
			   subscription_tier, created_at, is_active
		FROM users WHERE id = $1`,
		userID,
	).Scan(
		&user.ID, &user.Email, &user.Username, &user.FirstName, &user.LastName,
		&user.SubscriptionTier, &user.CreatedAt, &user.IsActive,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func UpdateUserByID(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Admin user update not implemented yet"})
}

func DeleteUserByID(c *gin.Context) {
	userID := c.Param("id")
	
	// Validate UUID
	_, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	db := database.GetDB()
	_, err = db.Exec("UPDATE users SET is_active = false WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func GetSystemStats(c *gin.Context) {
	db := database.GetDB()
	
	var stats struct {
		TotalUsers       int `json:"total_users"`
		ActiveUsers      int `json:"active_users"`
		FreeUsers        int `json:"free_users"`
		PaidUsers        int `json:"paid_users"`
		TotalStorage     int `json:"total_storage_mb"`
	}

	// Get user counts
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&stats.TotalUsers)
	db.QueryRow("SELECT COUNT(*) FROM users WHERE is_active = true").Scan(&stats.ActiveUsers)
	db.QueryRow("SELECT COUNT(*) FROM users WHERE subscription_tier = 'free'").Scan(&stats.FreeUsers)
	db.QueryRow("SELECT COUNT(*) FROM users WHERE subscription_tier != 'free'").Scan(&stats.PaidUsers)
	db.QueryRow("SELECT COALESCE(SUM(storage_used_mb), 0) FROM users").Scan(&stats.TotalStorage)

	c.JSON(http.StatusOK, stats)
}