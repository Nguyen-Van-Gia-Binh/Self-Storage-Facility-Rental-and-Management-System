package com.swp391.selfstorage.reservation.dto;

public class CustomerHistoryItemResponse {

    private String at;
    private String kind;
    private String title;
    private String detail;

    public CustomerHistoryItemResponse() {}

    public CustomerHistoryItemResponse(String at, String kind, String title, String detail) {
        this.at = at;
        this.kind = kind;
        this.title = title;
        this.detail = detail;
    }

    public String getAt() { return at; }
    public void setAt(String at) { this.at = at; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
