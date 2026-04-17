const express = require("express");
const router = express.Router();
const {
    getAllDeletionRequests,
    getPendingDeletionRequests,
    getDeletionRequest,
    reactivateAccount,
    permanentlyDeleteAccount,
    getAccountInfo
} = require("../Controller/AccountDeletion");

// Get all deletion requests
router.get("/all", getAllDeletionRequests);

// Get pending deletion requests
router.get("/pending", getPendingDeletionRequests);

// Get specific deletion request
router.get("/:id", getDeletionRequest);

// Get account info (user details from deletion request)
router.get("/info/:requestId", getAccountInfo);

// Reactivate account (reject deletion request)
router.post("/reactivate", reactivateAccount);

// Permanently delete account (approve deletion request)
router.post("/approve", permanentlyDeleteAccount);

module.exports = router;
