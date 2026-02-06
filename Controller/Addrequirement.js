const { default: mongoose } = require("mongoose");
const Requirement = require("../Modal/Addrequirement");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");
const Subsubcategory = require("../Modal/Subsubcategory");
const WeightUnit = require("../Modal/Weightunit");


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
      status: "Inactive",
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


// exports.placeOrUpdateOffer = async (req, res) => {
//   try {
//     const requirementId = String(req.params.requirementId || "").trim();
//     const { farmerId, offeredQuantity, offeredPricePerUnit, note } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(requirementId)) {
//       return res.status(400).json({ success: false, message: "Invalid requirementId" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(farmerId)) {
//       return res.status(400).json({ success: false, message: "Invalid farmerId" });
//     }

//     const qtyNum = Number(offeredQuantity || 0);
//     const priceNum = Number(offeredPricePerUnit || 0);

//     if (qtyNum <= 0) {
//       return res.status(400).json({ success: false, message: "offeredQuantity must be > 0" });
//     }
//     if (priceNum <= 0) {
//       return res.status(400).json({ success: false, message: "offeredPricePerUnit must be > 0" });
//     }

//     const reqDoc = await Requirement.findById(requirementId);
//     if (!reqDoc) {
//       return res.status(404).json({ success: false, message: "Requirement not found" });
//     }

//     if (reqDoc.status !== "Active") {
//       return res.status(400).json({ success: false, message: "Requirement is not active" });
//     }

//     const existsIdx = (reqDoc.vendorData || []).findIndex(
//       (v) => String(v.vendorId) === String(farmerId) && v.refre === "farmer"
//     );

//     if (existsIdx >= 0) {
//       reqDoc.vendorData[existsIdx].offeredQuantity = qtyNum;
//       reqDoc.vendorData[existsIdx].offeredPricePerUnit = priceNum;
//       reqDoc.vendorData[existsIdx].note = String(note || "");
//       reqDoc.vendorData[existsIdx].vendorStatus = "pending";
//       reqDoc.vendorData[existsIdx].updatedAt = new Date();
//     } else {
//       reqDoc.vendorData.push({
//         vendorId: farmerId,
//         refre: "farmer",
//         offeredQuantity: qtyNum,
//         offeredPricePerUnit: priceNum,
//         note: String(note || ""),
//         vendorStatus: "pending",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       });
//     }

//     await reqDoc.save();

//     return res.status(200).json({
//       success: true,
//       message: existsIdx >= 0 ? "Offer updated" : "Offer placed",
//       data: reqDoc,
//     });
//   } catch (err) {
//     console.error("placeOrUpdateOffer error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };


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
    requirement.status = "Inactive";
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

exports.updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    const updated = await Requirement.findByIdAndUpdate(
      id,
      { approvalStatus },
      { new: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
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


// exports.adminAcceptRejectOffer = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const requirementId = String(req.params.requirementId || "").trim();
//     const vendorId = String(req.params.vendorId || "").trim();

//     const action = String(req.body.action || "").trim();
//     const rejectionMessage = String(req.body.rejectionMessage || "").trim();

//     if (!mongoose.Types.ObjectId.isValid(requirementId)) {
//       return res.status(400).json({ success: false, message: "Invalid requirementId" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//       return res.status(400).json({ success: false, message: "Invalid vendorId" });
//     }

//     if (!["accepted", "rejected"].includes(action)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid action. Use accepted or rejected",
//       });
//     }

//     const reqDoc = await Requirement.findById(requirementId).session(session);
//     if (!reqDoc) {
//       return res.status(404).json({ success: false, message: "Requirement not found" });
//     }

//     reqDoc.vendorData = reqDoc.vendorData || [];

//     const idx = reqDoc.vendorData.findIndex(
//       (v) => String(v.vendorId) === String(vendorId) && v.refre === "farmer"
//     );

//     if (idx < 0) {
//       return res.status(404).json({ success: false, message: "Vendor offer not found" });
//     }

//     const vendor = reqDoc.vendorData[idx];


//     if (vendor.vendorStatus !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot ${action}. Current vendorStatus: ${vendor.vendorStatus}`,
//       });
//     }

//     if (action === "accepted") {
//       vendor.vendorStatus = "accepted";
//       vendor.acceptedAt = new Date();
//       vendor.updatedAt = new Date();
//       vendor.rejectionMessage = "";


//       if (!vendor.inventoryAdded) {
//         const addQty = Number(reqDoc.quantity || 0);

//         if (!Number.isFinite(addQty) || addQty <= 0) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid requirement quantity for inventory add",
//           });
//         }

//         reqDoc.inventory = Number(reqDoc.inventory || 0) - addQty;
//         reqDoc.availableQuantity = Number(reqDoc.availableQuantity || 0) - addQty;

//         vendor.inventoryAdded = true;
//       }

//       await reqDoc.save({ session });
//       await session.commitTransaction();

//       return res.status(200).json({
//         success: true,
//         message: "Admin accepted offer. Inventory added from requirement quantity.",
//         vendor,
//         data: reqDoc,
//       });
//     }


//     vendor.vendorStatus = "rejected";
//     vendor.updatedAt = new Date();
//     vendor.acceptedAt = null;
//     vendor.inventoryAdded = false;
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


// exports.adminAcceptRejectOffer = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const requirementId = String(req.params.requirementId || "").trim();
//     const vendorId = String(req.params.vendorId || "").trim();

//     const action = String(req.body.action || "").trim(); // accepted | rejected
//     const rejectionMessage = String(req.body.rejectionMessage || "").trim();

//     if (!mongoose.Types.ObjectId.isValid(requirementId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid requirementId" });
//     }
//     if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//       return res.status(400).json({ success: false, message: "Invalid vendorId" });
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

//     reqDoc.vendorData = reqDoc.vendorData || [];

//     const idx = reqDoc.vendorData.findIndex(
//       (v) => String(v.vendorId) === String(vendorId) && v.refre === "farmer"
//     );

//     if (idx < 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Vendor offer not found" });
//     }

//     const vendor = reqDoc.vendorData[idx];

//     // ✅ Only pending can be actioned
//     if (vendor.vendorStatus !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot ${action}. Current vendorStatus: ${vendor.vendorStatus}`,
//       });
//     }

//     // ✅ Validate qty once (needed for accept flow)
//     const addQty = Number(reqDoc.quantity || 0);
//     if (!Number.isFinite(addQty) || addQty <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid requirement quantity",
//       });
//     }

//     // ✅ ACCEPT
//     if (action === "accepted") {
//       vendor.vendorStatus = "accepted";
//       vendor.acceptedAt = new Date();
//       vendor.updatedAt = new Date();
//       vendor.rejectionMessage = "";

//       /**
//        * ✅ YOUR CHANGE:
//        * When farmer offer is accepted, you want to MINUS requirement qty
//        * from inventory and availableQuantity (instead of adding).
//        *
//        * Also prevent going negative.
//        */
//       if (!vendor.inventoryAdded) {
//         const currentInv = Number(reqDoc.inventory || 0);
//         const currentAvail = Number(reqDoc.availableQuantity || 0);

//         if (!Number.isFinite(currentInv) || currentInv < 0) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid inventory value in requirement",
//           });
//         }

//         if (!Number.isFinite(currentAvail) || currentAvail < 0) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid availableQuantity value in requirement",
//           });
//         }

//         if (currentInv < addQty || currentAvail < addQty) {
//           return res.status(400).json({
//             success: false,
//             message: `Not enough inventory/availableQuantity to subtract. Need ${addQty}, have inventory=${currentInv}, available=${currentAvail}`,
//           });
//         }

//         reqDoc.inventory = currentInv - addQty;
//         reqDoc.availableQuantity = currentAvail - addQty;

//         vendor.inventoryAdded = true; // keeping your flag name for idempotency
//       }

//       await reqDoc.save({ session });
//       await session.commitTransaction();

//       return res.status(200).json({
//         success: true,
//         message:
//           "Admin accepted offer. Inventory and availableQuantity reduced by requirement quantity.",
//         vendor,
//         data: reqDoc,
//       });
//     }

//     // ✅ REJECT
//     vendor.vendorStatus = "rejected";
//     vendor.updatedAt = new Date();
//     vendor.acceptedAt = null;
//     vendor.inventoryAdded = false;
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


exports.adminAcceptRejectOffer = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const requirementId = String(req.params.requirementId || "").trim();
    const vendorId = String(req.params.vendorId || "").trim();

    const action = String(req.body.action || "").trim(); // "accepted" | "rejected"
    const rejectionMessage = String(req.body.rejectionMessage || "").trim();

    if (!mongoose.Types.ObjectId.isValid(requirementId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid requirementId" });
    }
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vendorId" });
    }

    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use accepted or rejected",
      });
    }

    const reqDoc = await Requirement.findById(requirementId).session(session);
    if (!reqDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Requirement not found" });
    }

    reqDoc.vendorData = Array.isArray(reqDoc.vendorData) ? reqDoc.vendorData : [];

    const idx = reqDoc.vendorData.findIndex(
      (v) => String(v.vendorId) === String(vendorId) && v.refre === "farmer"
    );

    if (idx < 0) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor offer not found" });
    }

    const vendor = reqDoc.vendorData[idx];

    // ✅ Base quantity = requirement quantity (50 in your example)
    const totalQty = Number(reqDoc.quantity || 0);
    if (!Number.isFinite(totalQty) || totalQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid requirement quantity",
      });
    }

    // ✅ Use vendor offeredQuantity (20 in your example)
    const offeredQty = Number(vendor.offeredQuantity || 0);
    if (!Number.isFinite(offeredQty) || offeredQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor offeredQuantity",
      });
    }

    if (offeredQty > totalQty) {
      return res.status(400).json({
        success: false,
        message: `offeredQuantity (${offeredQty}) cannot be greater than requirement quantity (${totalQty})`,
      });
    }

    // ✅ Your case: availableQuantity is 0 initially, but you want it to behave like "50"
    // So if availableQuantity is missing/0, treat it as totalQty (50).
    const currentAvailRaw = Number(reqDoc.availableQuantity || 0);
    const baseAvailable = currentAvailRaw > 0 ? currentAvailRaw : totalQty;

    // ---------------- ACCEPT ----------------
    if (action === "accepted") {
      // allow accept when pending OR rejected (so accept again after reject works)
      const st = String(vendor.vendorStatus || "pending");
      if (!["pending", "rejected"].includes(st)) {
        return res.status(400).json({
          success: false,
          message: `Cannot accept. Current vendorStatus: ${vendor.vendorStatus}`,
        });
      }

      // ✅ Idempotent subtract: only subtract if not already applied
      if (!vendor.inventoryAdded) {
        if (baseAvailable < offeredQty) {
          return res.status(400).json({
            success: false,
            message: `Not enough availableQuantity. Need ${offeredQty}, have ${baseAvailable}`,
          });
        }

        // ✅ EXACT NEED: 50 - 20 = 30
        reqDoc.availableQuantity = baseAvailable - offeredQty;

        // ❌ As you asked now: DO NOT add/subtract inventory here
        // reqDoc.inventory = ... (not touched)

        vendor.inventoryAdded = true; // means offeredQty is already applied once
      }

      vendor.vendorStatus = "accepted";
      vendor.acceptedAt = new Date();
      vendor.updatedAt = new Date();
      vendor.rejectionMessage = "";

      await reqDoc.save({ session });
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: `Accepted. availableQuantity updated to ${reqDoc.availableQuantity} (base ${baseAvailable} - offered ${offeredQty}).`,
        vendor,
        data: reqDoc,
      });
    }

    // ---------------- REJECT ----------------
    // allow reject when pending OR accepted
    const st = String(vendor.vendorStatus || "pending");
    if (!["pending", "accepted"].includes(st)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Current vendorStatus: ${vendor.vendorStatus}`,
      });
    }

    // ✅ If this vendor was accepted earlier and we subtracted offeredQty, then add it back on reject.
    // If vendor was pending and rejected directly, inventoryAdded will be false => no add-back.
    if (vendor.inventoryAdded === true) {
      const nowAvailRaw = Number(reqDoc.availableQuantity || 0);
      const nowAvailBase = nowAvailRaw > 0 ? nowAvailRaw : totalQty;

      // add back but never exceed totalQty
      const restored = Math.min(totalQty, nowAvailBase + offeredQty);
      reqDoc.availableQuantity = restored;

      vendor.inventoryAdded = false; // prevent double add-back

      // ❌ As you asked: inventory should NOT be added back here
      // reqDoc.inventory = ... (not touched)
    }

    vendor.vendorStatus = "rejected";
    vendor.updatedAt = new Date();
    vendor.acceptedAt = null;
    vendor.rejectionMessage = rejectionMessage || "Rejected by admin";

    await reqDoc.save({ session });
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: vendor.rejectionMessage,
      vendor,
      data: reqDoc,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("❌ adminAcceptRejectOffer error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    session.endSession();
  }
};

