package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.EventRequest;
import com.quanlychitieu.dto.response.EventResponse;
import com.quanlychitieu.dto.response.TransactionResponse;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.Event;
import com.quanlychitieu.model.entity.Transaction;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.repository.EventRepository;
import com.quanlychitieu.repository.TransactionRepository;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final TransactionRepository transactionRepository;
    private final SecurityUtils securityUtils;

    public List<EventResponse> getAllEvents(Long userId) {
        return eventRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<EventResponse> getActiveEvents(Long userId) {
        return eventRepository.findByUserIdAndCompletedFalseOrderByStartDateAsc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EventResponse getEvent(Long id, Long userId) {
        Event event = eventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        return toResponse(event);
    }

    @Transactional
    public EventResponse createEvent(EventRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Event event = Event.builder()
                .name(request.getName())
                .icon(request.getIcon())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .note(request.getNote())
                .user(securityUtils.getCurrentUser())
                .build();
        event = eventRepository.save(event);
        log.info("Created event: {}", event.getName());
        return toResponse(event);
    }

    @Transactional
    public EventResponse updateEvent(Long id, EventRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Event event = eventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        event.setName(request.getName());
        event.setIcon(request.getIcon());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setNote(request.getNote());
        event = eventRepository.save(event);
        return toResponse(event);
    }

    @Transactional
    public EventResponse toggleComplete(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Event event = eventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        event.setCompleted(!event.isCompleted());
        event = eventRepository.save(event);
        return toResponse(event);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Event event = eventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        eventRepository.delete(event);
    }

    /**
     * Lấy tất cả giao dịch của 1 event
     */
    public List<TransactionResponse> getEventTransactions(Long eventId, Long userId) {
        eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
        return transactionRepository.findByEventIdOrderByTransactionDateDesc(eventId).stream()
                .map(this::toTransactionResponse)
                .collect(Collectors.toList());
    }

    private EventResponse toResponse(Event e) {
        BigDecimal totalExpense = eventRepository.sumExpenseByEventId(e.getId());
        BigDecimal totalIncome = eventRepository.sumIncomeByEventId(e.getId());

        return EventResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .icon(e.getIcon())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .note(e.getNote())
                .completed(e.isCompleted())
                .totalExpense(totalExpense)
                .totalIncome(totalIncome)
                .netAmount(totalIncome.subtract(totalExpense))
                .transactionCount(eventRepository.countTransactionsByEventId(e.getId()))
                .createdAt(e.getCreatedAt())
                .build();
    }

    private TransactionResponse toTransactionResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .type(t.getType())
                .note(t.getNote())
                .transactionDate(t.getTransactionDate())
                .categoryName(t.getCategory().getName())
                .categoryId(t.getCategory().getId())
                .categoryIcon(t.getCategory().getIcon())
                .categoryColor(t.getCategory().getColor())
                .walletName(t.getWallet().getName())
                .walletId(t.getWallet().getId())
                .eventId(t.getEvent() != null ? t.getEvent().getId() : null)
                .eventName(t.getEvent() != null ? t.getEvent().getName() : null)
                .excludeFromReport(t.isExcludeFromReport())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
