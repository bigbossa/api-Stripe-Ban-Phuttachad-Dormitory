require("dotenv").config();
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// Connect Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🔧 สร้างโฟลเดอร์และเซฟไฟล์ (รองรับ JPG, PNG, PDF)
function addfile(path, name, file) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  const [prefix, base64] = file.split(",");
  const mimeMatch = prefix.match(/data:(.*?);base64/);

  if (!mimeMatch) throw new Error("Invalid file format");

  const mime = mimeMatch[1];
  let extension = "bin";

  if (mime === "application/pdf") extension = "pdf";
  else if (mime === "image/jpeg") extension = "jpg";
  else if (mime === "image/png") extension = "png";
  else throw new Error("Unsupported file type");

  const fileName = `${name}.${extension}`;
  const filePath = `./images/${fileName}`;

  fs.writeFileSync(filePath, base64, "base64");
  return fileName;
}

// 🔧 ลบไฟล์ออก
function removefile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removed file: ${filePath}`);
  } else {
    console.warn(`⚠️ File not found: ${filePath}`);
  }
}

// ✅ สร้างไฟล์ใหม่
exports.insertimage = async (req, res) => {
  try {
    const { tenant_id, image } = req.body;
    if (!tenant_id || !image) throw new Error("Missing tenant_id or image");

    const fileName = addfile("images", tenant_id, image);

    const { error } = await supabase
      .from("tenants")
      .update({ image: fileName })
      .eq("id", tenant_id);

    if (error) throw error;

    res.send({
      status: "200",
      message: "success",
      detail: "Uploaded and saved to tenants.",
      img: fileName,
    });
  } catch (err) {
    res.status(500).send({ status: "500", message: "error", detail: err.message });
  }
};

// ✅ อัปเดตไฟล์ (ลบเก่า เพิ่มใหม่)
exports.updateimage = async (req, res) => {
  try {
    const { tenant_id, image } = req.body;
    if (!tenant_id || !image) throw new Error("Missing tenant_id or image");

    const { data, error: fetchError } = await supabase
      .from("tenants")
      .select("image")
      .eq("id", tenant_id)
      .single();

    if (fetchError) throw fetchError;

    const oldFile = data?.image;
    if (oldFile) {
      const oldFilePath = `./images/${oldFile}`;
      removefile(oldFilePath);
    }

    const fileName = addfile("images", tenant_id, image);

    const { error } = await supabase
      .from("tenants")
      .update({ image: fileName })
      .eq("id", tenant_id);

    if (error) throw error;

    res.send({
      status: "200",
      message: "success",
      detail: "Updated and saved to tenants.",
      img: fileName,
    });
  } catch (err) {
    res.status(500).send({ status: "500", message: "error", detail: err.message });
  }
};

// ✅ ลบไฟล์
exports.removeimage = async (req, res) => {
  try {
    const { tenant_id } = req.body;
    if (!tenant_id) throw new Error("Missing tenant_id");

    const { data, error: fetchError } = await supabase
      .from("tenants")
      .select("image")
      .eq("id", tenant_id)
      .single();

    if (fetchError) throw fetchError;

    const fileName = data?.image;
    if (fileName) {
      const filePath = `./images/${fileName}`;
      removefile(filePath);
    }

    const { error } = await supabase
      .from("tenants")
      .update({ image: null })
      .eq("id", tenant_id);

    if (error) throw error;

    res.send({
      status: "200",
      message: "success",
      detail: "Removed image and cleared tenants.image",
    });
  } catch (err) {
    res.status(500).send({ status: "500", message: "error", detail: err.message });
  }
};
