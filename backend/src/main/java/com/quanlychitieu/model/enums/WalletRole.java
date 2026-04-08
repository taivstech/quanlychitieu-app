package com.quanlychitieu.model.enums;

public enum WalletRole {
    OWNER,   // Chủ ví (Quyền tối cao: sửa, xóa ví, mời/xóa thành viên, thu/chi)
    EDITOR,  // Trợ lý (Được thêm, sửa, xóa giao dịch của mình trong ví, và xem giao dịch người khác)
    VIEWER   // Người quan sát (Chỉ xem)
}
