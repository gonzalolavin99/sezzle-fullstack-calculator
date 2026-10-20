package platform

import (
	"log/slog"
	"slices"
	"testing"
)

// env builds a fake getenv from a map, so tests never touch the real environment.
func env(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

func TestLoadConfig(t *testing.T) {
	tests := []struct {
		name    string
		env     map[string]string
		want    Config
		wantErr bool
	}{
		{
			name: "defaults when nothing is set",
			env:  map[string]string{},
			want: Config{Port: "8080", AllowedOrigins: []string{"http://localhost:5173"}, LogLevel: slog.LevelInfo},
		},
		{
			name: "custom values",
			env:  map[string]string{"PORT": "9000", "ALLOWED_ORIGINS": "https://a.example", "LOG_LEVEL": "debug"},
			want: Config{Port: "9000", AllowedOrigins: []string{"https://a.example"}, LogLevel: slog.LevelDebug},
		},
		{
			name: "origins are trimmed and empty entries dropped",
			env:  map[string]string{"ALLOWED_ORIGINS": " https://a.example , ,https://b.example "},
			want: Config{Port: "8080", AllowedOrigins: []string{"https://a.example", "https://b.example"}, LogLevel: slog.LevelInfo},
		},
		{
			name: "log level is case-insensitive",
			env:  map[string]string{"LOG_LEVEL": "WARN"},
			want: Config{Port: "8080", AllowedOrigins: []string{"http://localhost:5173"}, LogLevel: slog.LevelWarn},
		},
		{name: "port is not a number", env: map[string]string{"PORT": "http"}, wantErr: true},
		{name: "port out of range", env: map[string]string{"PORT": "70000"}, wantErr: true},
		{name: "negative port", env: map[string]string{"PORT": "-1"}, wantErr: true},
		{name: "unknown log level", env: map[string]string{"LOG_LEVEL": "verbose"}, wantErr: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := LoadConfig(env(tc.env))
			if tc.wantErr {
				if err == nil {
					t.Fatalf("LoadConfig() = %+v, want an error", got)
				}
				return
			}
			if err != nil {
				t.Fatalf("LoadConfig() error = %v", err)
			}
			if got.Port != tc.want.Port || got.LogLevel != tc.want.LogLevel || !slices.Equal(got.AllowedOrigins, tc.want.AllowedOrigins) {
				t.Errorf("LoadConfig() = %+v, want %+v", got, tc.want)
			}
		})
	}
}
