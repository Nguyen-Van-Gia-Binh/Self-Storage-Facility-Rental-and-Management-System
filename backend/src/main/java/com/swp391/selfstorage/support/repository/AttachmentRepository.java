package com.swp391.selfstorage.support.repository;

import com.swp391.selfstorage.support.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByEntityTypeAndEntityId(String entityType, Long entityId);

    void deleteByEntityTypeAndEntityId(String entityType, Long entityId);
}
