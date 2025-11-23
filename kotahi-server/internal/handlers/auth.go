package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"video-player-backend/internal/database"
	"video-player-backend/internal/errors"
	"video-player-backend/internal/models"
	jwtutils "video-player-backend/internal/utils"
	"video-player-backend/internal/validation"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	userRepo   database.UserRepository
	jwtManager *jwtutils.JWTManager
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(userRepo database.UserRepository, jwtManager *jwtutils.JWTManager) *AuthHandler {
	return &AuthHandler{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.UserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteErrorResponse(w, errors.ErrInvalidRequest)
		return
	}

	// Validate request
	if ve := validation.ValidateUserRequest(&req); ve.HasErrors() {
		errors.WriteValidationError(w, ve)
		return
	}

	// Check if user already exists
	ctx := r.Context()
	existingUser, err := h.userRepo.GetByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		errors.WriteErrorResponse(w, errors.ErrUserAlreadyExists)
		return
	}

	existingUser, err = h.userRepo.GetByUsername(ctx, req.Username)
	if err == nil && existingUser != nil {
		errors.WriteErrorResponse(w, errors.ErrUserAlreadyExists)
		return
	}

	// Create new user
	user := req.ToUser()
	if err := h.userRepo.Create(ctx, user); err != nil {
		log.Printf("Error creating user: %v", err)
		errors.WriteErrorResponse(w, errors.ErrDatabase)
		return
	}

	// Generate JWT token
	token, err := h.jwtManager.GenerateToken(user)
	if err != nil {
		log.Printf("Error generating token: %v", err)
		errors.WriteErrorResponse(w, errors.ErrInternalServer)
		return
	}

	// Return response
	response := models.AuthResponse{
		User:  *user.ToUserResponse(),
		Token: token,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteErrorResponse(w, errors.ErrInvalidRequest)
		return
	}

	// Validate request
	if ve := validation.ValidateLoginRequest(&req); ve.HasErrors() {
		errors.WriteValidationError(w, ve)
		return
	}

	// Get user by email
	ctx := r.Context()
	user, err := h.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		log.Printf("AUTH: Failed login attempt for email: %s (user not found)", req.Email)
		errors.WriteErrorResponse(w, errors.ErrInvalidCredentials)
		return
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		log.Printf("AUTH: Failed login attempt for email: %s (invalid password)", req.Email)
		errors.WriteErrorResponse(w, errors.ErrInvalidCredentials)
		return
	}

	// Generate JWT token
	token, err := h.jwtManager.GenerateToken(user)
	if err != nil {
		log.Printf("Error generating token: %v", err)
		errors.WriteErrorResponse(w, errors.ErrInternalServer)
		return
	}

	// Return response
	response := models.AuthResponse{
		User:  *user.ToUserResponse(),
		Token: token,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetProfile handles getting user profile
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		errors.WriteErrorResponse(w, errors.ErrUnauthorized)
		return
	}

	// Get user from database
	ctx := r.Context()
	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil {
		errors.WriteErrorResponse(w, errors.ErrUserNotFound)
		return
	}

	// Return user profile
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user.ToUserResponse())
}

// UpdateProfile handles updating user profile
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		errors.WriteErrorResponse(w, errors.ErrUnauthorized)
		return
	}

	var req models.UserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteErrorResponse(w, errors.ErrInvalidRequest)
		return
	}

	// Validate request
	if ve := validation.ValidateUserRequest(&req); ve.HasErrors() {
		errors.WriteValidationError(w, ve)
		return
	}

	// Get existing user
	ctx := r.Context()
	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil {
		errors.WriteErrorResponse(w, errors.ErrUserNotFound)
		return
	}

	// Check if email is already taken by another user
	if req.Email != user.Email {
		existingUser, err := h.userRepo.GetByEmail(ctx, req.Email)
		if err == nil && existingUser != nil {
			errors.WriteErrorResponse(w, errors.ErrUserAlreadyExists)
			return
		}
	}

	// Check if username is already taken by another user
	if req.Username != user.Username {
		existingUser, err := h.userRepo.GetByUsername(ctx, req.Username)
		if err == nil && existingUser != nil {
			errors.WriteErrorResponse(w, errors.ErrUserAlreadyExists)
			return
		}
	}

	// Update user
	user.Email = req.Email
	user.Username = req.Username
	user.UpdatedAt = time.Now()

	// Hash new password if provided
	if req.Password != "" {
		if err := user.HashPassword(req.Password); err != nil {
			log.Printf("Error hashing password: %v", err)
			errors.WriteErrorResponse(w, errors.ErrInternalServer)
			return
		}
	}

	if err := h.userRepo.Update(ctx, userID, user); err != nil {
		log.Printf("Error updating user: %v", err)
		errors.WriteErrorResponse(w, errors.ErrDatabase)
		return
	}

	// Return updated user profile
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user.ToUserResponse())
}
