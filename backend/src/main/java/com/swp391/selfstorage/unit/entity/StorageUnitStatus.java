package com.swp391.selfstorage.unit.entity;

public enum StorageUnitStatus {
    AVAILABLE,
    RESERVED,
    OCCUPIED,
    CLEANING,
    MAINTENANCE,
    OUT_OF_SERVICE;

    public boolean canTransitionTo(StorageUnitStatus target) {
        if (this == target) return true;
        return switch (this) {
            case AVAILABLE -> target == MAINTENANCE || target == OUT_OF_SERVICE || target == RESERVED;
            case RESERVED -> target == OCCUPIED || target == AVAILABLE;
            case OCCUPIED -> target == CLEANING;
            case CLEANING -> target == AVAILABLE || target == RESERVED || target == MAINTENANCE;
            case MAINTENANCE -> target == AVAILABLE || target == CLEANING || target == OUT_OF_SERVICE;
            case OUT_OF_SERVICE -> target == MAINTENANCE || target == AVAILABLE;
        };
    }
}
