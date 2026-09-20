package com.swp391.selfstorage.reservation.dto;

/**
 * Phản hồi chi tiết bảng tính tiền thuê kho và tiền cọc.
 * Tuân thủ BR-DEP-01 (cọc 1 tháng) và BR-GEN-04 (làm tròn đến 1.000 VNĐ).
 */
public class CalculatePriceResponse {

    private long monthlyPrice;
    private int rentalMonths;
    private long rawRentTotal;
    private double discountPercentage;
    private long discountAmount;
    private long finalRentTotal;
    private long depositAmount;
    private long totalDueToday;

    public CalculatePriceResponse() {}

    public CalculatePriceResponse(long monthlyPrice, int rentalMonths, long rawRentTotal,
                                  double discountPercentage, long discountAmount, long finalRentTotal,
                                  long depositAmount, long totalDueToday) {
        this.monthlyPrice = monthlyPrice;
        this.rentalMonths = rentalMonths;
        this.rawRentTotal = rawRentTotal;
        this.discountPercentage = discountPercentage;
        this.discountAmount = discountAmount;
        this.finalRentTotal = finalRentTotal;
        this.depositAmount = depositAmount;
        this.totalDueToday = totalDueToday;
    }

    // Getters and Setters
    public long getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(long monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public int getRentalMonths() { return rentalMonths; }
    public void setRentalMonths(int rentalMonths) { this.rentalMonths = rentalMonths; }

    public long getRawRentTotal() { return rawRentTotal; }
    public void setRawRentTotal(long rawRentTotal) { this.rawRentTotal = rawRentTotal; }

    public double getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(double discountPercentage) { this.discountPercentage = discountPercentage; }

    public long getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(long discountAmount) { this.discountAmount = discountAmount; }

    public long getFinalRentTotal() { return finalRentTotal; }
    public void setFinalRentTotal(long finalRentTotal) { this.finalRentTotal = finalRentTotal; }

    public long getDepositAmount() { return depositAmount; }
    public void setDepositAmount(long depositAmount) { this.depositAmount = depositAmount; }

    public long getTotalDueToday() { return totalDueToday; }
    public void setTotalDueToday(long totalDueToday) { this.totalDueToday = totalDueToday; }
}
