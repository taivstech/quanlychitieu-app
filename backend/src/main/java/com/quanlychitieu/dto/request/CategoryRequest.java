package com.quanlychitieu.dto.request;

import com.quanlychitieu.model.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 50)
    private String name;

    private String icon;
    private String color;

    @NotNull(message = "Loại danh mục không được để trống")
    private CategoryType type;

    private Long parentId;
}
