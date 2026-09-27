package com.aegisops.platform.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public authentication & healthcheck endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/**", "/health", "/health/**", "/metrics", "/metrics/**").permitAll()
                        .requestMatchers("/api/system/health").permitAll()
                        // Public citizen reporting intake & NLP triage
                        .requestMatchers(HttpMethod.POST, "/api/requests", "/api/reports", "/api/nlp/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/requests/**", "/api/reports/**").permitAll()
                        .requestMatchers("/api/public/**", "/api/nlp/**").permitAll()
                        // Public or telemetry data, hospitals, and national mutual aid
                        .requestMatchers("/api/zones/**", "/api/external/**", "/api/alerts/**", "/api/hospitals/**", "/api/aggregation/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/hospitals/**", "/api/teams/**", "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/hospitals/**", "/api/aggregation/**").permitAll()
                        .requestMatchers("/api/predictions/**").permitAll()
                        // WebSocket STOMP handshake endpoints
                        .requestMatchers("/ws/**", "/ws-emergency/**").permitAll()
                        // Role-guarded administrative endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/dispatch/**").hasAnyRole("ADMIN", "DISPATCHER")
                        .requestMatchers("/api/responder/**").hasAnyRole("ADMIN", "DISPATCHER", "FIELD_RESPONDER")
                        // Allow all dashboard GET feeds for public awareness / guest dispatchers
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

