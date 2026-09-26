package com.aegisops.platform.repository;

import com.aegisops.platform.entity.UserEntity;
import com.aegisops.platform.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByUsernameOrEmail(String username, String email);
    List<UserEntity> findByRole(UserRole role);
    List<UserEntity> findByZoneId(String zoneId);
}

