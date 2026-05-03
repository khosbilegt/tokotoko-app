package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"video-player-backend/internal/config"
	"video-player-backend/internal/database"
	"video-player-backend/internal/middleware"
	"video-player-backend/internal/services"
	jwtutils "video-player-backend/internal/utils"

	"github.com/gorilla/mux"
)

// SetupRoutes configures all routes for the application
func SetupRoutes(cfg *config.Config, db *database.MongoDB, videoRepo database.VideoRepository, userRepo database.UserRepository, vocabRepo database.VocabularyRepository, vocabIndexRepo database.VocabularyIndexRepository, watchHistoryRepo database.WatchHistoryRepository, playlistRepo database.PlaylistRepository) *mux.Router {
	r := mux.NewRouter()

	log.Println("Setting up routes")

	// Apply middleware
	r.Use(middleware.Logging)

	// Create JWT manager
	jwtManager := jwtutils.NewJWTManager(&cfg.JWT)

	// Create email service
	emailService := services.NewEmailService(&cfg.Email)

	// Create handlers
	videoHandler := NewVideoHandler(videoRepo)
	authHandler := NewAuthHandler(userRepo, jwtManager)
	vocabularyHandler := NewVocabularyHandler(vocabRepo, vocabIndexRepo, videoRepo)
	vocabularySearchHandler := NewVocabularySearchHandler(vocabRepo, vocabIndexRepo, videoRepo, watchHistoryRepo)
	watchHistoryHandler := NewWatchHistoryHandler(watchHistoryRepo, videoRepo)
	vttHandler := NewVTTUploadHandler("./uploads/vtt", vocabRepo, vocabIndexRepo, videoRepo)
	learningListHandler := NewLearningListHandler(db)
	playlistHandler := NewPlaylistHandler(playlistRepo, videoRepo)
	searchHandler := NewSearchHandler(videoRepo, vocabRepo, vocabIndexRepo)
	feedbackHandler := NewFeedbackHandler(emailService)
	contactHandler := NewContactHandler(emailService)

	// Public VTT file downloads (no auth). Must be registered on the root router
	// before the /api/v1 subrouter so these requests are not delegated only to api
	// (where blank-prefix protected/admin routes are registered ahead of uploads).
	r.PathPrefix("/api/v1/uploads/vtt/").Handler(
		http.StripPrefix("/api/v1/uploads/vtt/", http.FileServer(http.Dir("./uploads/vtt/"))))

	// API routes
	api := r.PathPrefix("/api/v1").Subrouter()

	// Public authentication routes
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")

	// Protected routes (require authentication)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.AuthMiddleware(jwtManager))

	// Admin-only routes (require admin role)
	admin := api.PathPrefix("").Subrouter()
	admin.Use(middleware.AdminMiddleware)

	// User profile routes (authenticated users)
	protected.HandleFunc("/auth/profile", authHandler.GetProfile).Methods("GET")
	protected.HandleFunc("/auth/profile", authHandler.UpdateProfile).Methods("PUT")

	// Video routes - public read access, admin-only write access
	api.HandleFunc("/videos", videoHandler.GetVideos).Methods("GET")
	api.HandleFunc("/videos/{id}", videoHandler.GetVideo).Methods("GET")
	admin.HandleFunc("/videos", videoHandler.CreateVideo).Methods("POST")
	admin.HandleFunc("/videos/{id}", videoHandler.UpdateVideo).Methods("PUT")
	admin.HandleFunc("/videos/{id}", videoHandler.DeleteVideo).Methods("DELETE")

	// Vocabulary routes - public read access, admin-only write access
	api.HandleFunc("/vocabulary", vocabularyHandler.GetVocabularies).Methods("GET")
	api.HandleFunc("/vocabulary/{id}", vocabularyHandler.GetVocabulary).Methods("GET")
	api.HandleFunc("/vocabulary/search", vocabularyHandler.SearchVocabularies).Methods("GET")
	admin.HandleFunc("/vocabulary", vocabularyHandler.CreateVocabulary).Methods("POST")
	admin.HandleFunc("/vocabulary/batch-upload", vocabularyHandler.BatchVocabularyUpload).Methods("POST")
	admin.HandleFunc("/vocabulary/{id}", vocabularyHandler.UpdateVocabulary).Methods("PUT")
	admin.HandleFunc("/vocabulary/{id}", vocabularyHandler.DeleteVocabulary).Methods("DELETE")

	// Vocabulary search routes - public read access
	api.HandleFunc("/vocabulary/search/index", vocabularySearchHandler.SearchVocabulary).Methods("GET")
	api.HandleFunc("/vocabulary/search/english", vocabularySearchHandler.SearchByEnglish).Methods("GET")
	api.HandleFunc("/vocabulary/video", vocabularySearchHandler.GetVideoVocabulary).Methods("GET")
	api.HandleFunc("/vocabulary/stats", vocabularySearchHandler.GetVocabularyStats).Methods("GET")
	admin.HandleFunc("/vocabulary/reindex", vocabularySearchHandler.ReindexAllVideos).Methods("POST")

	// Watch history routes (authenticated users - no admin required)
	protected.HandleFunc("/watch-history", watchHistoryHandler.GetWatchHistory).Methods("GET")
	protected.HandleFunc("/watch-history/video", watchHistoryHandler.GetWatchHistoryByVideo).Methods("GET")
	protected.HandleFunc("/watch-history", watchHistoryHandler.CreateOrUpdateWatchHistory).Methods("POST")
	protected.HandleFunc("/watch-history", watchHistoryHandler.DeleteWatchHistory).Methods("DELETE")
	protected.HandleFunc("/watch-history/recent", watchHistoryHandler.GetRecentWatched).Methods("GET")
	protected.HandleFunc("/watch-history/completed", watchHistoryHandler.GetCompletedVideos).Methods("GET")
	protected.HandleFunc("/watch-history/progress", watchHistoryHandler.GetUserProgress).Methods("GET")

	// Learning list routes (authenticated users - no admin required)
	protected.HandleFunc("/learning-list", learningListHandler.GetLearningList).Methods("GET")
	protected.HandleFunc("/learning-list", learningListHandler.CreateLearningListItem).Methods("POST")
	protected.HandleFunc("/learning-list/stats", learningListHandler.GetLearningListStats).Methods("GET")
	protected.HandleFunc("/learning-list/export", learningListHandler.ExportLearningList).Methods("GET")
	protected.HandleFunc("/learning-list/{id}", learningListHandler.GetLearningListItem).Methods("GET")
	protected.HandleFunc("/learning-list/{id}", learningListHandler.UpdateLearningListItem).Methods("PUT")
	protected.HandleFunc("/learning-list/{id}", learningListHandler.DeleteLearningListItem).Methods("DELETE")

	// Playlist routes (authenticated users - no admin required)
	protected.HandleFunc("/playlists", playlistHandler.GetPlaylists).Methods("GET")
	protected.HandleFunc("/playlists/user", playlistHandler.GetUserPlaylists).Methods("GET")
	protected.HandleFunc("/playlists/public", playlistHandler.GetPublicPlaylists).Methods("GET")
	protected.HandleFunc("/playlists", playlistHandler.CreatePlaylist).Methods("POST")
	protected.HandleFunc("/playlists/{id}", playlistHandler.GetPlaylist).Methods("GET")
	protected.HandleFunc("/playlists/{id}", playlistHandler.UpdatePlaylist).Methods("PUT")
	protected.HandleFunc("/playlists/{id}", playlistHandler.DeletePlaylist).Methods("DELETE")
	protected.HandleFunc("/playlists/{id}/videos", playlistHandler.AddVideoToPlaylist).Methods("POST")
	protected.HandleFunc("/playlists/{id}/videos", playlistHandler.RemoveVideoFromPlaylist).Methods("DELETE")
	protected.HandleFunc("/playlists/{id}/reorder", playlistHandler.ReorderPlaylistVideos).Methods("PUT")

	// General search route (public access)
	api.HandleFunc("/search", searchHandler.GeneralSearch).Methods("GET")

	// Contact and feedback routes (public access)
	api.HandleFunc("/contact", contactHandler.SubmitContact).Methods("POST")
	api.HandleFunc("/feedback", feedbackHandler.SubmitFeedback).Methods("POST")

	// VTT file routes (admin-only)
	admin.HandleFunc("/vtt/upload", vttHandler.UploadVTT).Methods("POST")
	admin.HandleFunc("/vtt/list", vttHandler.ListVTTFiles).Methods("GET")
	admin.HandleFunc("/vtt/delete", vttHandler.DeleteVTTFile).Methods("DELETE")

	// Admin email test route
	admin.HandleFunc("/email/test", feedbackHandler.TestEmail).Methods("POST")

	// Health check endpoint
	r.HandleFunc("/health", healthCheck).Methods("GET")

	// Seed endpoint (for development)
	r.HandleFunc("/seed", seedDatabase).Methods("POST")

	return r
}

// healthCheck handles health check requests
func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "video-player-backend",
	})
}

// seedDatabase handles seeding the database with sample data
func seedDatabase(w http.ResponseWriter, r *http.Request) {
	// This is a simple seed endpoint - in production, you'd want proper authentication
	// and more sophisticated seeding logic

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Use the seed command: go run cmd/seed/main.go",
		"note":    "This endpoint is for development purposes only",
	})
}
