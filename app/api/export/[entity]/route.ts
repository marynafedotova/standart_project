import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/auth";
import { getClientsForAdmin, getOrdersForAdmin, getProducts } from "@/lib/store";

function parseIds(searchParams: URLSearchParams) {
  return new Set(searchParams.getAll("id").map((value) => value.trim()).filter(Boolean));
}

function excelResponse(filename: string, sheetName: string, rows: Array<Record<string, string | number>>) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  }

  const { entity } = await params;
  const { searchParams } = new URL(request.url);
  const ids = parseIds(searchParams);
  const mode = searchParams.get("mode") ?? "all";

  if (entity === "products") {
    const products = await getProducts();
    const selected = mode === "selected" ? products.filter((item) => ids.has(item.id)) : products;

    return excelResponse(
      "products.xlsx",
      "Products",
      selected.map((product) => ({
        id: product.id,
        article: product.sku,
        code: product.code,
        group: product.group,
        variantColor: product.variantColor,
        slug: product.slug,
        name: product.name,
        name_uk: product.nameI18n?.uk ?? "",
        name_ru: product.nameI18n?.ru ?? "",
        name_en: product.nameI18n?.en ?? "",
        category: product.category,
        brand: product.brand,
        status: product.status,
        price: product.price,
        oldPrice: product.oldPrice ?? "",
        stock: product.stock,
        warehouseStock: product.warehouseStock.map((entry) => `${entry.warehouse}:${entry.quantity}`).join(" | "),
        size: product.size,
        sizes: product.sizes.join(" | "),
        centimeters: product.centimeters,
        ageGroup: product.ageGroup,
        season: product.season,
        audience: product.audience,
        material: product.material,
        materials: product.materials.join(" | "),
        colors: product.colors.join(" | "),
        badge: product.badge ?? "",
        description: product.description,
        description_uk: product.descriptionI18n?.uk ?? "",
        description_ru: product.descriptionI18n?.ru ?? "",
        description_en: product.descriptionI18n?.en ?? "",
        features: product.features.join(" | "),
        image: product.image,
        gallery: product.images.join(" | "),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }))
    );
  }

  if (entity === "orders") {
    const orders = await getOrdersForAdmin();
    const selected = mode === "selected" ? orders.filter((item) => ids.has(item.id)) : orders;

    return excelResponse(
      "orders.xlsx",
      "Orders",
      selected.map((order) => ({
        orderNumber: `#${order.orderNumber}`,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        deliveryMethod: order.deliveryMethod,
        region: order.region,
        city: order.city,
        branch: order.novaPoshtaBranch,
        courierAddress: order.courierAddress,
        status: order.status,
        total: order.total,
        items: order.items.map((item) => `${item.name} x${item.quantity}`).join(" | "),
        createdAt: order.createdAt
      }))
    );
  }

  if (entity === "clients") {
    const clients = await getClientsForAdmin();
    const selected = mode === "selected" ? clients.filter((item) => ids.has(item.id)) : clients;

    return excelResponse(
      "clients.xlsx",
      "Clients",
      selected.map((client) => ({
        name: client.name,
        phone: client.phone,
        email: client.email,
        ordersCount: client.orderIds.length,
        orderNumbers: client.orderNumbers.map((number) => `#${number}`).join(" | "),
        totalSpent: client.totalSpent,
        updatedAt: client.updatedAt
      }))
    );
  }

  return NextResponse.json({ error: "Неизвестный тип выгрузки." }, { status: 404 });
}
