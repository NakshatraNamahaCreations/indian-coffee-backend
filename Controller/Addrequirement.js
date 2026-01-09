// Controller/Addrequirement.js
const Requirement = require("../Modal/Addrequirement");
const Category = require("../Modal/Category");
const Subcategory = require("../Modal/Subcategory");
const Subsubcategory = require("../Modal/Subsubcategory");
const WeightUnit = require("../Modal/Weightunit");

/**
 * 1) CREATE REQUIREMENT (Trader creates requirement)
 */
exports.createProduct = async (req, res) => {
  try {
    console.log("🔥 HIT /createrequirement");
    console.log("➡️ Body:", req.body);
    console.log("➡️ File:", req.file);

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

      // ✅ new fields
      availableQuantity,
      inventory,
    } = req.body;

    // Basic validation
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

    // Image path (if file uploaded)
    let productImage = "";
    if (req.file) {
      // We will serve /uploads as static → store public path
      productImage = `/uploads/products/${req.file.filename}`;
    }

    // Fetch related documents in parallel
    const [category, subcategory, weightUnit] = await Promise.all([
      Category.findById(categoryId),
      Subcategory.findById(subcategoryId),
      WeightUnit.findById(weightUnitId),
    ]);

    let subsubcategory = null;
    if (subsubcategoryId && String(subsubcategoryId).trim() !== "") {
      subsubcategory = await Subsubcategory.findById(subsubcategoryId);
    }

    // Convert numeric fields safely
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

    // Create requirement document
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

      // ✅ new fields
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

/**
 * 2) ADMIN APPROVE (pending_admin -> admin_approved, status=Inactive)
 */
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

/**
 * 3) FARMER ACCEPT (admin_approved -> farmer_accepted) + push vendorData
 *    ✅ vendorStatus comes separately in body
 */
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
      vendorStatus: vendorStatus || "accepted", // ✅ status passed separately
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

/**
 * 4) FINAL ADMIN APPROVE (farmer_accepted -> final_admin_approved, status=Active)
 */
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


// ADMIN pending list
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