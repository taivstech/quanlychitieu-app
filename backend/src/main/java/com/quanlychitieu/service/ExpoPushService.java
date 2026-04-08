package com.quanlychitieu.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ExpoPushService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

    public void sendPushNotification(String to, String title, String body) {
        if (to == null || !to.startsWith("ExponentPushToken[")) {
            log.warn("Invalid or missing Expo push token: {}", to);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("Accept-Encoding", "gzip, deflate");

            Map<String, Object> message = new HashMap<>();
            message.put("to", to);
            message.put("sound", "default");
            message.put("title", title);
            message.put("body", body);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(message, headers);
            
            String response = restTemplate.postForObject(EXPO_PUSH_API_URL, request, String.class);
            log.info("Sent push notification to {}, Expo Response: {}", to, response);
        } catch (Exception e) {
            log.error("Failed to send Expo push notification to {}: {}", to, e.getMessage());
        }
    }
}
