package com.aegisops.platform.service;

import com.aegisops.platform.entity.UserEntity;
import com.aegisops.platform.enums.UserRole;
import com.aegisops.platform.repository.UserRepository;
import com.aegisops.platform.security.JwtTokenProvider;
import com.aegisops.platform.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public Map<String, Object> login(String usernameOrEmail, String password) {
        UserEntity user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        UserPrincipal principal = new UserPrincipal(user);
        String token = tokenProvider.generateToken(principal);

        return Map.of(
                "success", true,
                "token", token,
                "user", user,
                "isAdmin", user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.DISPATCHER
        );
    }

    @Transactional
    public Map<String, Object> registerCitizen(String username, String email, String password, String fullName, String phone, String zoneId) {
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Full name is required");
        }

        String cleanEmail = email != null ? email.trim().toLowerCase() : "";
        String cleanUsername = username != null && !username.isBlank() ? username.trim().toLowerCase()
                : fullName.toLowerCase().replaceAll("[^a-z0-9]", "_") + "_" + (100 + (int)(Math.random() * 900));

        if (userRepository.findByUsername(cleanUsername).isPresent() ||
                (!cleanEmail.isBlank() && userRepository.findByEmail(cleanEmail).isPresent())) {
            throw new IllegalArgumentException("An account with this email or username already exists. Please sign in.");
        }

        String rawPassword = (password != null && !password.isBlank()) ? password : "Password@123";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        UserEntity user = new UserEntity();
        user.setId("usr-cit-" + UUID.randomUUID().toString().substring(0, 8));
        user.setUsername(cleanUsername);
        user.setEmail(cleanEmail.isBlank() ? cleanUsername + "@citizen.aegisops.in" : cleanEmail);
        user.setPasswordHash(encodedPassword);
        user.setFullName(fullName.trim());
        user.setRole(UserRole.PUBLIC);
        user.setZoneId(zoneId != null ? zoneId : "zone-mh-mum");
        user.setPhoneNumber(phone != null ? phone : "+91-98000-00000");
        user.setIsActive(true);
        user.setCreatedAt(Instant.now());

        UserEntity saved = userRepository.save(user);

        UserPrincipal principal = new UserPrincipal(saved);
        String token = tokenProvider.generateToken(principal);

        return Map.of(
                "success", true,
                "token", token,
                "user", saved,
                "message", "Citizen registered successfully"
        );
    }
}

