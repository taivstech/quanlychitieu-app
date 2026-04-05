package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String icon;
    private String color;
    private CategoryType type;
    private Boolean isDefault;
    private List<CategoryResponse> subCategories;
}
