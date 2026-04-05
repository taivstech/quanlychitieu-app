package com.quanlychitieu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EventRequest {

    @NotBlank(message = "Tên sự kiện không được để trống")
    @Size(max = 100, message = "Tên sự kiện tối đa 100 ký tự")
    private String name;

    @Size(max = 50)
    private String icon;

    private LocalDate startDate;
    private LocalDate endDate;

    @Size(max = 500)
    private String note;
}
