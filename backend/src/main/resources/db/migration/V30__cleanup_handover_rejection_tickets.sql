-- V30: Đóng các ticket sự cố bàn giao tiếp đón đã tạo nhầm trước đây để tránh làm rác danh sách ca trực của nhân viên quầy
UPDATE support_request
SET status = 'CLOSED',
    relocation_required = FALSE,
    resolution_note = 'Hệ thống tự động đóng: Sự cố bàn giao tiếp đón không thuộc diện tạo Ticket Sự Cố cho nhân viên bàn giao',
    resolved_at = NOW(),
    updated_at = NOW()
WHERE (code LIKE 'INC-HD-%' OR code LIKE 'INC-REASSIGN-%' OR description LIKE 'Sự cố bàn giao tiếp đón%')
  AND status IN ('NEW', 'ASSIGNED', 'IN_PROGRESS');
