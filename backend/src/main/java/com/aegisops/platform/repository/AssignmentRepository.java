package com.aegisops.platform.repository;

import com.aegisops.platform.entity.AssignmentEntity;
import com.aegisops.platform.enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<AssignmentEntity, String> {
    List<AssignmentEntity> findByRequestId(String requestId);
    List<AssignmentEntity> findByTeamId(String teamId);
    List<AssignmentEntity> findByStatus(AssignmentStatus status);
}

