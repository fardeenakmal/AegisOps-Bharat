package com.aegisops.platform.service;

import com.aegisops.platform.adapter.DataFeedResult;
import com.aegisops.platform.adapter.RoutingAdapter;
import com.aegisops.platform.adapter.TacticalRoute;
import com.aegisops.platform.dto.SuggestedTeamDto;
import com.aegisops.platform.entity.AssignmentEntity;
import com.aegisops.platform.entity.EmergencyRequestEntity;
import com.aegisops.platform.entity.ResponseTeamEntity;
import com.aegisops.platform.enums.AssignmentStatus;
import com.aegisops.platform.enums.RequestStatus;
import com.aegisops.platform.enums.TeamStatus;
import com.aegisops.platform.enums.TeamType;
import com.aegisops.platform.repository.AssignmentRepository;
import com.aegisops.platform.repository.EmergencyRequestRepository;
import com.aegisops.platform.repository.ResponseTeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CoordinationService {

    private final ResponseTeamRepository teamRepository;
    private final AssignmentRepository assignmentRepository;
    private final EmergencyRequestRepository requestRepository;
    private final RoutingAdapter routingAdapter;
    private final AlertBroadcastService broadcastService;

    public CoordinationService(
            ResponseTeamRepository teamRepository,
            AssignmentRepository assignmentRepository,
            EmergencyRequestRepository requestRepository,
            RoutingAdapter routingAdapter,
            AlertBroadcastService broadcastService) {
        this.teamRepository = teamRepository;
        this.assignmentRepository = assignmentRepository;
        this.requestRepository = requestRepository;
        this.routingAdapter = routingAdapter;
        this.broadcastService = broadcastService;
    }

    public List<ResponseTeamEntity> getTeams(String zoneId, TeamType type, TeamStatus status) {
        if (zoneId != null && !zoneId.isBlank() && !"zone-ndma-in".equals(zoneId) && !"ALL".equals(zoneId)) {
            if (status != null) return teamRepository.findByZoneIdAndStatus(zoneId, status);
            return teamRepository.findByZoneId(zoneId);
        }
        if (status != null) return teamRepository.findByStatus(status);
        if (type != null) return teamRepository.findByTeamType(type);
        return teamRepository.findAll();
    }

    public List<SuggestedTeamDto> getSuggestedTeamsForRequest(String requestId) {
        EmergencyRequestEntity request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        List<ResponseTeamEntity> available = teamRepository.findByStatus(TeamStatus.AVAILABLE);
        List<SuggestedTeamDto> list = new ArrayList<>();

        for (ResponseTeamEntity team : available) {
            DataFeedResult<TacticalRoute> routeResult = routingAdapter.calculateEmergencyRoute(
                    team.getLatitude().doubleValue(),
                    team.getLongitude().doubleValue(),
                    request.getLatitude().doubleValue(),
                    request.getLongitude().doubleValue()
            );

            TacticalRoute route = routeResult.data();
            list.add(new SuggestedTeamDto(
                    team,
                    route.distanceMeters(),
                    route.durationMinutes(),
                    route.geometryGeoJson(),
                    route.detourAdvised()
            ));
        }

        list.sort(Comparator.comparingInt(SuggestedTeamDto::etaMinutes));
        return list;
    }

    @Transactional
    public AssignmentEntity dispatchTeam(String requestId, String teamId, String assignedByUserId, String customTaskBrief) {
        EmergencyRequestEntity request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        ResponseTeamEntity team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        DataFeedResult<TacticalRoute> routeResult = routingAdapter.calculateEmergencyRoute(
                team.getLatitude().doubleValue(), team.getLongitude().doubleValue(),
                request.getLatitude().doubleValue(), request.getLongitude().doubleValue()
        );

        TacticalRoute route = routeResult.data();

        String assignmentId = "asg-" + UUID.randomUUID().toString().substring(0, 8);
        AssignmentEntity assignment = new AssignmentEntity();
        assignment.setId(assignmentId);
        assignment.setRequestId(requestId);
        assignment.setTeamId(teamId);
        assignment.setAssignedByUserId(assignedByUserId);
        assignment.setStatus(AssignmentStatus.ASSIGNED);
        assignment.setTaskBrief(customTaskBrief != null ? customTaskBrief : "Emergency tactical response to " + request.getTitle());
        assignment.setEstimatedArrivalMinutes(route.durationMinutes());
        assignment.setRouteDistanceMeters(BigDecimal.valueOf(route.distanceMeters()));
        assignment.setRouteGeometryGeoJson(route.geometryGeoJson());
        assignment.setAssignedAt(Instant.now());

        // Update states
        team.setStatus(TeamStatus.DISPATCHED);
        teamRepository.save(team);

        request.setStatus(RequestStatus.ASSIGNED);
        requestRepository.save(request);

        AssignmentEntity savedAssignment = assignmentRepository.save(assignment);

        // STOMP Broadcasts
        broadcastService.broadcastTeamStatus(team, savedAssignment);
        broadcastService.broadcastRequestEvent("REQUEST_ASSIGNED", request);

        return savedAssignment;
    }

    @Transactional
    public AssignmentEntity updateAssignmentStatus(String assignmentId, AssignmentStatus newStatus, String notes) {
        AssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        assignment.setStatus(newStatus);
        if (notes != null) assignment.setResponderNotes(notes);

        Instant now = Instant.now();
        if (newStatus == AssignmentStatus.EN_ROUTE) assignment.setEnRouteAt(now);
        else if (newStatus == AssignmentStatus.ON_SCENE) assignment.setOnSceneAt(now);
        else if (newStatus == AssignmentStatus.RESOLVED) assignment.setResolvedAt(now);

        ResponseTeamEntity team = teamRepository.findById(assignment.getTeamId()).orElse(null);
        if (team != null) {
            if (newStatus == AssignmentStatus.EN_ROUTE) team.setStatus(TeamStatus.DISPATCHED);
            else if (newStatus == AssignmentStatus.ON_SCENE) team.setStatus(TeamStatus.ON_SCENE);
            else if (newStatus == AssignmentStatus.RESOLVED || newStatus == AssignmentStatus.CANCELLED) team.setStatus(TeamStatus.AVAILABLE);
            teamRepository.save(team);
        }

        EmergencyRequestEntity request = requestRepository.findById(assignment.getRequestId()).orElse(null);
        if (request != null && newStatus == AssignmentStatus.RESOLVED) {
            request.setStatus(RequestStatus.RESOLVED);
            request.setResolvedAt(now);
            requestRepository.save(request);
            broadcastService.broadcastRequestEvent("REQUEST_RESOLVED", request);
        }

        AssignmentEntity saved = assignmentRepository.save(assignment);
        if (team != null) broadcastService.broadcastTeamStatus(team, saved);

        return saved;
    }
}

