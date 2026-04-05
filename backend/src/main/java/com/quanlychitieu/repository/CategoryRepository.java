package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.Category;
import com.quanlychitieu.model.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.isDefault = true) AND c.parent IS NULL ORDER BY c.isDefault DESC, c.name ASC")
    List<Category> findRootCategoriesByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.isDefault = true) AND c.type = :type AND c.parent IS NULL")
    List<Category> findByUserIdAndType(@Param("userId") Long userId, @Param("type") CategoryType type);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.user.id = :userId OR c.isDefault = true)")
    Optional<Category> findByIdAndUserIdOrDefault(@Param("id") Long id, @Param("userId") Long userId);

    List<Category> findByIsDefaultTrue();
}
