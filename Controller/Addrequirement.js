const { default: mongoose } = require("mongoose");
const Requirement = require("../Modal/Addrequirement");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");
const Subsubcategory = require("../Modal/Subsubcategory");
const WeightUnit = require("../Modal/Weightunit");
const InAppNotification = require("../Modal/Notification");
const Farmer = require("../Modal/Farmer");
const Trader = require("../Modal/Trader")
const sendPushNotification = require("../utils/sendPushNotification");
const sendPushNotificationTrader = require("../utilstrader/sendPushNotification");


exports.createProduct = async (req, res) => {
  try {


    const {
      productTitle,
      categoryId,
      subcategoryId,
      subsubcategoryId,
      weightUnitId,
      quantity,
      pricePerUnit,
      desc,
      userId,
      availableQuantity,
      inventory,
    } = req.body;

    if (
      !productTitle ||
      !categoryId ||
      !subcategoryId ||
      !weightUnitId ||
      !quantity ||
      !pricePerUnit ||
      !desc ||
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let productImage = "";
    if (req.file) {
      productImage = `/uploads/products/${req.file.filename}`;
    }

    const [category, subcategory, weightUnit] = await Promise.all([
      Category.findById(categoryId),
      Subcategory.findById(subcategoryId),
      WeightUnit.findById(weightUnitId),
    ]);

    let subsubcategory = null;
    if (subsubcategoryId && String(subsubcategoryId).trim() !== "") {
      subsubcategory = await Subsubcategory.findById(subsubcategoryId);
    }

    const qtyNum = Number(quantity) || 0;
    const priceNum = Number(pricePerUnit) || 0;
    const availableQtyNum =
      availableQuantity !== undefined && availableQuantity !== null
        ? Number(availableQuantity)
        : qtyNum;
    const inventoryNum =
      inventory !== undefined && inventory !== null
        ? Number(inventory)
        : qtyNum;

    const requirement = await Requirement.create({
      productTitle,

      categoryId,
      categoryName: category?.Categoryname || "",

      subcategoryId,
      subcategoryName: subcategory?.subcategoryName || "",

      subsubcategoryId: subsubcategory ? subsubcategoryId : undefined,
      subsubcategoryName: subsubcategory?.subsubcategoryName || "",

      weightUnitId,
      weightUnitName: weightUnit?.weightUnitName || "",

      quantity: qtyNum,
      pricePerUnit: priceNum,

      availableQuantity: availableQtyNum,
      inventory: inventoryNum,

      desc,
      userId,

      productImage,
      approvalStatus: "pending_admin",
      status: "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Requirement created successfully",
      data: requirement,
    });
  } catch (err) {
    console.error("❌ createProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while creating requirement",
    });
  }
};


exports.placeOrUpdateOffer = async (req, res) => {
  try {
    const requirementId = String(req.params.requirementId || "").trim();
    const { farmerId, offeredQuantity, offeredPricePerUnit, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
      return res.status(400).json({ success: false, message: "Invalid requirementId" });
    }
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ success: false, message: "Invalid farmerId" });
    }

    const qtyNum = Number(offeredQuantity || 0);
    const priceNum = Number(offeredPricePerUnit || 0);

    if (qtyNum <= 0) {
      return res.status(400).json({ success: false, message: "offeredQuantity must be > 0" });
    }
    if (priceNum <= 0) {
      return res.status(400).json({ success: false, message: "offeredPricePerUnit must be > 0" });
    }

    const reqDoc = await Requirement.findById(requirementId);
    if (!reqDoc) {
      return res.status(404).json({ success: false, message: "Requirement not found" });
    }

    if (reqDoc.status !== "Active") {
      return res.status(400).json({ success: false, message: "Requirement is not active" });
    }

    reqDoc.vendorData = reqDoc.vendorData || [];

    const idx = reqDoc.vendorData.findIndex(
      (v) => String(v.vendorId) === String(farmerId) && v.refre === "farmer"
    );

    let action = "created";

    if (idx >= 0) {
      action = "updated";

      // ✅ prevent editing after accepted (optional but recommended)
      if (reqDoc.vendorData[idx].vendorStatus === "accepted") {
        return res.status(400).json({ success: false, message: "Cannot update after admin accepted" });
      }

      reqDoc.vendorData[idx].offeredQuantity = qtyNum;
      reqDoc.vendorData[idx].offeredPricePerUnit = priceNum;
      reqDoc.vendorData[idx].note = String(note || "");
      reqDoc.vendorData[idx].vendorStatus = "pending";
      reqDoc.vendorData[idx].rejectionMessage = "";
      reqDoc.vendorData[idx].updatedAt = new Date();
    } else {
      reqDoc.vendorData.push({
        vendorId: farmerId,
        refre: "farmer",
        offeredQuantity: qtyNum,
        offeredPricePerUnit: priceNum,
        note: String(note || ""),
        vendorStatus: "pending",
        rejectionMessage: "",
        inventoryAdded: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        acceptedAt: null,
      });
    }

    await reqDoc.save();

    const vendor = reqDoc.vendorData.find(
      (v) => String(v.vendorId) === String(farmerId) && v.refre === "farmer"
    );

    return res.status(200).json({
      success: true,
      message: action === "updated" ? "Offer updated" : "Offer placed",
      action,
      vendor,
      data: reqDoc,
    });
  } catch (err) {
    console.error("❌ placeOrUpdateOffer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.adminApproveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res
        .status(404)
        .json({ success: false, message: "Requirement not found" });
    }

    if (requirement.approvalStatus !== "pending_admin") {
      return res.status(400).json({
        success: false,
        message: `Cannot admin-approve from: ${requirement.approvalStatus}`,
      });
    }

    requirement.approvalStatus = "admin_approved";
    requirement.status = "Active";
    await requirement.save();

    return res.json({
      success: true,
      message: "Admin approved. Now visible in Farmer app.",
      data: requirement,
    });
  } catch (err) {
    console.error("❌ adminApproveProduct error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while admin approving" });
  }
};


exports.farmerAcceptProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { farmerId, vendorStatus } = req.body;

    if (!farmerId) {
      return res
        .status(400)
        .json({ success: false, message: "farmerId is required" });
    }

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res
        .status(404)
        .json({ success: false, message: "Requirement not found" });
    }

    if (requirement.approvalStatus !== "admin_approved") {
      return res.status(400).json({
        success: false,
        message: `Farmer can accept only when admin_approved. Current: ${requirement.approvalStatus}`,
      });
    }

    requirement.vendorData = requirement.vendorData || [];
    requirement.vendorData.push({
      vendorId: farmerId,
      refre: "farmer",
      vendorStatus: vendorStatus || "accepted",
    });

    requirement.approvalStatus = "farmer_accepted";
    await requirement.save();

    return res.json({
      success: true,
      message: "Farmer accepted. Waiting for final admin approval.",
      data: requirement,
    });
  } catch (err) {
    console.error("❌ farmerAcceptProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while farmer accepting requirement",
    });
  }
};


exports.finalAdminApproveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res
        .status(404)
        .json({ success: false, message: "Requirement not found" });
    }

    if (requirement.approvalStatus !== "farmer_accepted") {
      return res.status(400).json({
        success: false,
        message: `Final admin approve only after farmer_accepted. Current: ${requirement.approvalStatus}`,
      });
    }

    requirement.approvalStatus = "final_admin_approved";
    requirement.status = "Active";
    await requirement.save();

    return res.json({
      success: true,
      message: "Final admin approved. Now Active.",
      data: requirement,
    });
  } catch (err) {
    console.error("❌ finalAdminApproveProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while final admin approving",
    });
  }
};


exports.listForFarmerApp = async (req, res) => {
  try {
    const list = await Requirement.find({
      approvalStatus: "admin_approved",
    }).sort({ createdAt: -1 });

    return res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error("❌ listForFarmerApp error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while listing for farmer app",
    });
  }
};


exports.getallrequirement = async (req, res) => {
  try {
    const list = await Requirement.find({})
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err) {
    console.error("❌ listForFarmerApp error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while listing for farmer app",
    });
  }
};


exports.listPendingAdmin = async (req, res) => {
  try {
    const list = await Requirement.find({
      approvalStatus: "pending_admin",
    }).sort({ createdAt: -1 });

    return res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error("❌ listPendingAdmin error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while listing pending admin",
    });
  }
};


exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const list = await Requirement.find({ userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err) {
    console.error("❌ listByUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching requirements by user",
    });
  }
};

// exports.updateApproval = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { approvalStatus } = req.body;

//     const updated = await Requirement.findByIdAndUpdate(
//       id,
//       { approvalStatus },
//       { new: true }
//     );

//     return res.json({ success: true, data: updated });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

exports.updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid requirement id" });
    }

    if (!approvalStatus) {
      return res.status(400).json({ success: false, message: "approvalStatus is required" });
    }

    // ✅ Update approvalStatus
    const updated = await Requirement.findByIdAndUpdate(
      id,
      { approvalStatus },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Requirement not found" });
    }

    const requirementTitle =
      updated.productTitle || updated.title || updated.requirementTitle || "Product";

    // ----------------------------------
    // ✅ 1) TRADER notification (always)
    // requirement.userId => Trader._id
    // ----------------------------------
    try {
      const traderId = String(updated.userId || "");

      if (mongoose.Types.ObjectId.isValid(traderId)) {
        const traderDoc = await Trader.findById(traderId).select("_id name status");

        if (traderDoc) {
          await InAppNotification.create({
            userId: String(traderDoc._id),
            notificationType: "NEW_PRODUCT_AVAILABLE",
            thumbnailTitle: "📌 Approval Status Updated",
            notifyTo: "customer",
            message: `Your product "${requirementTitle}" approval status changed to "${approvalStatus}".`,
            metaData: {
              requirementId: String(updated._id),
              traderId: String(traderDoc._id),
              approvalStatus,
            },
            status: "unread",
          });
        }
      }
    } catch (notiErr) {
      console.error("Trader notification failed:", notiErr.message);
    }

    // ----------------------------------
    // ✅ 2) If approved -> notify ALL farmers
    // ----------------------------------
    if (approvalStatus === "admin_approved") {
      try {
        const farmers = await Farmer.find({}).select("_id");

        if (farmers?.length) {
          const farmerNotis = farmers.map((f) => ({
            userId: String(f._id),
            notificationType: "NEW_PRODUCT_AVAILABLE",
            thumbnailTitle: "🆕 New Trader Requirement",
            notifyTo: "vendor",
            message: `There is a new requirement for "${requirementTitle}", See details`,
            // message: `New product "${requirementTitle}" is now available. Check it in the app.`,
            metaData: {
              requirementId: String(updated._id),
              approvalStatus,
            },
            status: "unread",
          }));

          await InAppNotification.insertMany(farmerNotis, { ordered: false });
        }
      } catch (bulkErr) {
        console.error("Farmer bulk notification failed:", bulkErr.message);
      }
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateApproval error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.rejectRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = String(req.body?.reason || "").trim();

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: "Requirement not found" });
    }

    // ✅ prevent reject after final approval (optional)
    if (requirement.approvalStatus === "final_admin_approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject after final admin approval",
      });
    }

    // ✅ DO NOT TOUCH inventory here
    requirement.approvalStatus = "rejected";
    requirement.status = "Inactive";

    // optional: store reason if you add field in schema
    if (reason) requirement.rejectionReason = reason;

    await requirement.save();

    return res.status(200).json({
      success: true,
      message: reason
        ? `Requirement rejected: ${reason}`
        : "Requirement rejected successfully",
      data: requirement,
    });
  } catch (err) {
    console.error("❌ rejectRequirement error:", err);
    return res.status(500).json({ success: false, message: "Server error while rejecting" });
  }
};

exports.withdrawOfferByFarmer = async (req, res) => {
  try {
    const requirementId = String(req.params.requirementId || "").trim();
    const farmerId = String(req.params.farmerId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
      return res.status(400).json({ success: false, message: "Invalid requirementId" });
    }
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ success: false, message: "Invalid farmerId" });
    }

    const reqDoc = await Requirement.findById(requirementId);
    if (!reqDoc) {
      return res.status(404).json({ success: false, message: "Requirement not found" });
    }

    const idx = (reqDoc.vendorData || []).findIndex(
      (v) => String(v.vendorId) === String(farmerId) && v.refre === "farmer"
    );

    if (idx < 0) {
      return res.status(404).json({ success: false, message: "Offer not found for this farmer" });
    }

    // ✅ block withdraw after accepted (optional but recommended)
    if (reqDoc.vendorData[idx].vendorStatus === "accepted") {
      return res.status(400).json({ success: false, message: "Cannot withdraw after admin accepted" });
    }

    const removed = reqDoc.vendorData[idx];
    reqDoc.vendorData.splice(idx, 1);

    await reqDoc.save();

    return res.status(200).json({
      success: true,
      message: "Offer withdrawn and removed successfully",
      removedVendor: removed,
      data: reqDoc,
    });
  } catch (err) {
    console.error("❌ withdrawOfferByFarmer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.adminAcceptRejectOffer = async (req, res) => {
  const session = await mongoose.startSession();

  // ✅ No "who"/"type" field
  const traderPushQueue = []; // [{ token, title, body, data }]
  const farmerPushQueue = []; // [{ token, title, body, data }]

  try {
    session.startTransaction();

    const requirementId = String(req.params.requirementId || "").trim();
    const vendorId = String(req.params.vendorId || "").trim();
    const action = String(req.body.action || "").trim(); // accepted | rejected
    const rejectionMessage = String(req.body.rejectionMessage || "").trim();

    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
      return res.status(400).json({ success: false, message: "Invalid requirementId" });
    }
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendorId" });
    }
    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use accepted or rejected",
      });
    }

    const reqDoc = await Requirement.findById(requirementId).session(session);
    if (!reqDoc) {
      return res.status(404).json({ success: false, message: "Requirement not found" });
    }

    reqDoc.vendorData = Array.isArray(reqDoc.vendorData) ? reqDoc.vendorData : [];

    const idx = reqDoc.vendorData.findIndex(
      (v) => String(v.vendorId) === String(vendorId) && v.refre === "farmer"
    );
    if (idx < 0) {
      return res.status(404).json({ success: false, message: "Vendor offer not found" });
    }

    const vendor = reqDoc.vendorData[idx];

    const totalQty = Number(reqDoc.quantity || 0);
    if (!Number.isFinite(totalQty) || totalQty <= 0) {
      return res.status(400).json({ success: false, message: "Invalid requirement quantity" });
    }

    const offeredQty = Number(vendor.offeredQuantity || 0);
    if (!Number.isFinite(offeredQty) || offeredQty <= 0) {
      return res.status(400).json({ success: false, message: "Invalid vendor offeredQuantity" });
    }

    if (offeredQty > totalQty) {
      return res.status(400).json({
        success: false,
        message: `offeredQuantity (${offeredQty}) cannot be greater than requirement quantity (${totalQty})`,
      });
    }

    const currentAvailRaw = Number(reqDoc.availableQuantity || 0);
    const baseAvailable = currentAvailRaw > 0 ? currentAvailRaw : totalQty;

    const productTitle = reqDoc.productTitle || reqDoc.title || "Product";

    // ✅ Trader = reqDoc.userId  (notifyTo = "customer")
    let traderDoc = null;
    try {
      const traderId = String(reqDoc.userId || "");
      if (mongoose.Types.ObjectId.isValid(traderId)) {
        traderDoc = await Trader.findById(traderId)
          .select("_id name fcmToken")
          .session(session);
      }
    } catch (e) {
      traderDoc = null;
    }

    // ✅ Farmer/Vendor = vendorId (notifyTo = "vendor")
    let farmerDoc = null;
    try {
      farmerDoc = await Farmer.findById(vendorId)
        .select("_id name fcmToken")
        .session(session);
    } catch (e) {
      farmerDoc = null;
    }

    // ---------------- ACCEPT ----------------
    if (action === "accepted") {
      const st = String(vendor.vendorStatus || "pending");
      if (!["pending", "rejected"].includes(st)) {
        return res.status(400).json({
          success: false,
          message: `Cannot accept. Current vendorStatus: ${vendor.vendorStatus}`,
        });
      }

      if (!vendor.inventoryAdded) {
        if (baseAvailable < offeredQty) {
          return res.status(400).json({
            success: false,
            message: `Not enough availableQuantity. Need ${offeredQty}, have ${baseAvailable}`,
          });
        }
        reqDoc.availableQuantity = baseAvailable - offeredQty;
        vendor.inventoryAdded = true;
      }

      vendor.vendorStatus = "accepted";
      vendor.acceptedAt = new Date();
      vendor.updatedAt = new Date();
      vendor.rejectionMessage = "";

      await reqDoc.save({ session });

      // ✅ InApp - Trader (notifyTo: customer)
      try {
        if (traderDoc?._id) {
          await InAppNotification.create(
            [
              {
                userId: String(traderDoc._id),
                notificationType: "OFFER_ACCEPTED",
                thumbnailTitle: "✅ Offer Accepted",
                notifyTo: "customer",
                message: `Offer accepted for "${productTitle}" (Qty: ${offeredQty}).`,
                metaData: {
                  requirementId: String(reqDoc._id),
                  vendorId: String(vendorId),
                  action: "accepted",
                  offeredQty,
                },
                status: "unread",
              },
            ],
            { session }
          );

          if (traderDoc.fcmToken) {
            traderPushQueue.push({
              token: traderDoc.fcmToken,
              title: "Offer Accepted ✅",
              body: `Offer accepted for "${productTitle}".`,
              data: {
                type: "OFFER_ACCEPTED",
                requirementId: String(reqDoc._id),
                vendorId: String(vendorId),
              },
            });
          }
        }
      } catch (e) {
        console.error("Trader InApp failed:", e.message);
      }

      // ✅ InApp - Farmer (notifyTo: vendor)
      try {
        if (farmerDoc?._id) {
          await InAppNotification.create(
            [
              {
                userId: String(farmerDoc._id),
                notificationType: "YOUR_OFFER_ACCEPTED",
                thumbnailTitle: "✅ Your Offer Accepted",
                notifyTo: "vendor",
                message: `Your offer for "${productTitle}" accepted (Qty: ${offeredQty}).`,
                metaData: {
                  requirementId: String(reqDoc._id),
                  action: "accepted",
                  offeredQty,
                },
                status: "unread",
              },
            ],
            { session }
          );

          if (farmerDoc.fcmToken) {
            farmerPushQueue.push({
              token: farmerDoc.fcmToken,
              title: "Offer Accepted ✅",
              body: `Your offer for "${productTitle}" is accepted.`,
              data: {
                type: "YOUR_OFFER_ACCEPTED",
                requirementId: String(reqDoc._id),
              },
            });
          }
        }
      } catch (e) {
        console.error("Farmer InApp failed:", e.message);
      }

      await session.commitTransaction();

      // ✅ PUSH after commit
      for (const p of traderPushQueue) {
        try {
          await sendPushNotificationTrader(p.token, p.title, p.body, p.data);
        } catch (e) {
          console.error("Trader push failed:", e.message);
        }
      }
      for (const p of farmerPushQueue) {
        try {
          await sendPushNotification(p.token, p.title, p.body, p.data);
        } catch (e) {
          console.error("Farmer push failed:", e.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Accepted. availableQuantity now ${reqDoc.availableQuantity}.`,
        vendor,
        data: reqDoc,
      });
    }

    // ---------------- REJECT ----------------
    const st = String(vendor.vendorStatus || "pending");
    if (!["pending", "accepted"].includes(st)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Current vendorStatus: ${vendor.vendorStatus}`,
      });
    }

    if (vendor.inventoryAdded === true) {
      const nowAvailRaw = Number(reqDoc.availableQuantity || 0);
      const nowAvailBase = nowAvailRaw > 0 ? nowAvailRaw : totalQty;

      reqDoc.availableQuantity = Math.min(totalQty, nowAvailBase + offeredQty);
      vendor.inventoryAdded = false;
    }

    vendor.vendorStatus = "rejected";
    vendor.updatedAt = new Date();
    vendor.acceptedAt = null;
    vendor.rejectionMessage = rejectionMessage || "Rejected by admin";

    await reqDoc.save({ session });

    // ✅ InApp - Trader (notifyTo: customer)
    try {
      if (traderDoc?._id) {
        await InAppNotification.create(
          [
            {
              userId: String(traderDoc._id),
              notificationType: "OFFER_REJECTED",
              thumbnailTitle: "❌ Offer Rejected",
              notifyTo: "customer",
              message: `Offer rejected for "${productTitle}".`,
              metaData: {
                requirementId: String(reqDoc._id),
                vendorId: String(vendorId),
                action: "rejected",
                reason: vendor.rejectionMessage,
              },
              status: "unread",
            },
          ],
          { session }
        );

        if (traderDoc.fcmToken) {
          traderPushQueue.push({
            token: traderDoc.fcmToken,
            title: "Offer Rejected ❌",
            body: `Offer rejected for "${productTitle}".`,
            data: {
              type: "OFFER_REJECTED",
              requirementId: String(reqDoc._id),
              vendorId: String(vendorId),
            },
          });
        }
      }
    } catch (e) {
      console.error("Trader InApp failed:", e.message);
    }

    // ✅ InApp - Farmer (notifyTo: vendor)
    try {
      if (farmerDoc?._id) {
        await InAppNotification.create(
          [
            {
              userId: String(farmerDoc._id),
              notificationType: "YOUR_OFFER_REJECTED",
              thumbnailTitle: "❌ Your Offer Rejected",
              notifyTo: "vendor",
              message: `Your offer for "${productTitle}" rejected.`,
              metaData: {
                requirementId: String(reqDoc._id),
                action: "rejected",
                reason: vendor.rejectionMessage,
              },
              status: "unread",
            },
          ],
          { session }
        );

        if (farmerDoc.fcmToken) {
          farmerPushQueue.push({
            token: farmerDoc.fcmToken,
            title: "Offer Rejected ❌",
            body: `Your offer for "${productTitle}" was rejected.`,
            data: {
              type: "YOUR_OFFER_REJECTED",
              requirementId: String(reqDoc._id),
            },
          });
        }
      }
    } catch (e) {
      console.error("Farmer InApp failed:", e.message);
    }

    await session.commitTransaction();

    // ✅ PUSH after commit
    for (const p of traderPushQueue) {
      try {
        await sendPushNotificationTrader(p.token, p.title, p.body, p.data);
      } catch (e) {
        console.error("Trader push failed:", e.message);
      }
    }
    for (const p of farmerPushQueue) {
      try {
        await sendPushNotification(p.token, p.title, p.body, p.data);
      } catch (e) {
        console.error("Farmer push failed:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: vendor.rejectionMessage,
      vendor,
      data: reqDoc,
    });
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch (e) { }

    console.error("❌ adminAcceptRejectOffer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    session.endSession();
  }
};


// exports.adminAcceptRejectOffer = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const requirementId = String(req.params.requirementId || "").trim();
//     const vendorId = String(req.params.vendorId || "").trim();

//     const action = String(req.body.action || "").trim(); // "accepted" | "rejected"
//     const rejectionMessage = String(req.body.rejectionMessage || "").trim();

//     if (!mongoose.Types.ObjectId.isValid(requirementId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid requirementId" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid vendorId" });
//     }

//     if (!["accepted", "rejected"].includes(action)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid action. Use accepted or rejected",
//       });
//     }

//     const reqDoc = await Requirement.findById(requirementId).session(session);
//     if (!reqDoc) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Requirement not found" });
//     }

//     reqDoc.vendorData = Array.isArray(reqDoc.vendorData) ? reqDoc.vendorData : [];

//     const idx = reqDoc.vendorData.findIndex(
//       (v) => String(v.vendorId) === String(vendorId) && v.refre === "farmer"
//     );

//     if (idx < 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Vendor offer not found" });
//     }

//     const vendor = reqDoc.vendorData[idx];

//     // ✅ Base quantity = requirement quantity (50 in your example)
//     const totalQty = Number(reqDoc.quantity || 0);
//     if (!Number.isFinite(totalQty) || totalQty <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid requirement quantity",
//       });
//     }

//     // ✅ Use vendor offeredQuantity (20 in your example)
//     const offeredQty = Number(vendor.offeredQuantity || 0);
//     if (!Number.isFinite(offeredQty) || offeredQty <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid vendor offeredQuantity",
//       });
//     }

//     if (offeredQty > totalQty) {
//       return res.status(400).json({
//         success: false,
//         message: `offeredQuantity (${offeredQty}) cannot be greater than requirement quantity (${totalQty})`,
//       });
//     }

//     // ✅ Your case: availableQuantity is 0 initially, but you want it to behave like "50"
//     // So if availableQuantity is missing/0, treat it as totalQty (50).
//     const currentAvailRaw = Number(reqDoc.availableQuantity || 0);
//     const baseAvailable = currentAvailRaw > 0 ? currentAvailRaw : totalQty;

//     // ---------------- ACCEPT ----------------
//     if (action === "accepted") {
//       // allow accept when pending OR rejected (so accept again after reject works)
//       const st = String(vendor.vendorStatus || "pending");
//       if (!["pending", "rejected"].includes(st)) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot accept. Current vendorStatus: ${vendor.vendorStatus}`,
//         });
//       }

//       // ✅ Idempotent subtract: only subtract if not already applied
//       if (!vendor.inventoryAdded) {
//         if (baseAvailable < offeredQty) {
//           return res.status(400).json({
//             success: false,
//             message: `Not enough availableQuantity. Need ${offeredQty}, have ${baseAvailable}`,
//           });
//         }

//         // ✅ EXACT NEED: 50 - 20 = 30
//         reqDoc.availableQuantity = baseAvailable - offeredQty;

//         // ❌ As you asked now: DO NOT add/subtract inventory here
//         // reqDoc.inventory = ... (not touched)

//         vendor.inventoryAdded = true; // means offeredQty is already applied once
//       }

//       vendor.vendorStatus = "accepted";
//       vendor.acceptedAt = new Date();
//       vendor.updatedAt = new Date();
//       vendor.rejectionMessage = "";

//       await reqDoc.save({ session });
//       await session.commitTransaction();

//       return res.status(200).json({
//         success: true,
//         message: `Accepted. availableQuantity updated to ${reqDoc.availableQuantity} (base ${baseAvailable} - offered ${offeredQty}).`,
//         vendor,
//         data: reqDoc,
//       });
//     }

//     // ---------------- REJECT ----------------
//     // allow reject when pending OR accepted
//     const st = String(vendor.vendorStatus || "pending");
//     if (!["pending", "accepted"].includes(st)) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot reject. Current vendorStatus: ${vendor.vendorStatus}`,
//       });
//     }

//     // ✅ If this vendor was accepted earlier and we subtracted offeredQty, then add it back on reject.
//     // If vendor was pending and rejected directly, inventoryAdded will be false => no add-back.
//     if (vendor.inventoryAdded === true) {
//       const nowAvailRaw = Number(reqDoc.availableQuantity || 0);
//       const nowAvailBase = nowAvailRaw > 0 ? nowAvailRaw : totalQty;

//       // add back but never exceed totalQty
//       const restored = Math.min(totalQty, nowAvailBase + offeredQty);
//       reqDoc.availableQuantity = restored;

//       vendor.inventoryAdded = false; // prevent double add-back

//       // ❌ As you asked: inventory should NOT be added back here
//       // reqDoc.inventory = ... (not touched)
//     }

//     vendor.vendorStatus = "rejected";
//     vendor.updatedAt = new Date();
//     vendor.acceptedAt = null;
//     vendor.rejectionMessage = rejectionMessage || "Rejected by admin";

//     await reqDoc.save({ session });
//     await session.commitTransaction();

//     return res.status(200).json({
//       success: true,
//       message: vendor.rejectionMessage,
//       vendor,
//       data: reqDoc,
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error("❌ adminAcceptRejectOffer error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   } finally {
//     session.endSession();
//   }
// };