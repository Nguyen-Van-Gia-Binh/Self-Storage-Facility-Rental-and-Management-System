package com.swp391.selfstorage.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

import com.swp391.selfstorage.payment.constant.PaymentTransactionType;
import com.swp391.selfstorage.policy.service.PolicyNumbers;

class SettlementCheckMigrationTest {

    @Test
    void migrationAllowsEveryPaymentTransactionTypeIncludingSettlement() throws Exception {
        String sql = Files.readString(Path.of("src/main/resources/db/migration/V27__settlement_paid_at_and_cancel_rates.sql"));
        for (PaymentTransactionType type : PaymentTransactionType.values()) {
            assertTrue(sql.contains("'" + type.name() + "'"), type.name());
        }
        assertTrue(sql.contains("paid_at"));
    }

    @Test
    void rescheduleFeeRoundsTheTotalUpToTheNextThousand() {
        assertEquals(187_000L, PolicyNumbers.prorateTotalUpToThousand(800_000L, 7, null));
    }
}
