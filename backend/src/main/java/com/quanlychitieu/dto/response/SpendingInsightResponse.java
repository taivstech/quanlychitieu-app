package com.quanlychitieu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Spending insights: gợi ý thông minh dựa trên phân tích chi tiêu.
 * VD: "Ăn uống tăng 30% so với tháng trước", "Bạn đã tiết kiệm được 500k tháng này"
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingInsightResponse {
    private List<Insight> insights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Insight {
        private String type;    // INCREASE, DECREASE, ACHIEVEMENT, WARNING, TIP
        private String icon;
        private String color;
        private String message;
        private String detail;
    }
}
