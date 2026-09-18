from fastapi.testclient import TestClient


def test_create_and_list_categories(client: TestClient) -> None:
    create_response = client.post("/api/categories", json={"name": "Ropa"})
    assert create_response.status_code == 201
    assert create_response.json()["name"] == "Ropa"

    list_response = client.get("/api/categories")
    assert list_response.status_code == 200
    payload = list_response.json()
    assert len(payload) == 1
    assert payload[0]["name"] == "Ropa"


def test_create_product_with_categories_and_filter_by_category(client: TestClient) -> None:
    category_response = client.post("/api/categories", json={"name": "Calzado"})
    category_id = category_response.json()["id"]

    product_response = client.post(
        "/api/products",
        json={
            "name": "Zapatilla Urbana",
            "price": 55999.9,
            "stock": 8,
            "active": True,
            "category_ids": [category_id],
        },
    )
    assert product_response.status_code == 201
    assert product_response.json()["categories"][0]["name"] == "Calzado"

    filtered_response = client.get(f"/api/products?category_id={category_id}")
    assert filtered_response.status_code == 200
    payload = filtered_response.json()
    assert len(payload) == 1
    assert payload[0]["name"] == "Zapatilla Urbana"


def test_soft_delete_product_hides_it_from_default_listing(client: TestClient) -> None:
    create_response = client.post(
        "/api/products",
        json={
            "name": "Campera",
            "price": 89999,
            "stock": 3,
            "active": True,
            "category_ids": [],
        },
    )
    product_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/products/{product_id}")
    assert delete_response.status_code == 204

    list_response = client.get("/api/products")
    assert list_response.status_code == 200
    assert list_response.json() == []

    include_inactive_response = client.get("/api/products?include_inactive=true")
    assert include_inactive_response.status_code == 200
    assert len(include_inactive_response.json()) == 1
    assert include_inactive_response.json()[0]["active"] is False


def test_create_and_lookup_product_by_barcode_preserves_leading_zeroes(client: TestClient) -> None:
    barcode = "07791234567890"
    create_response = client.post(
        "/api/products",
        json={
            "name": "Gaseosa",
            "sku": "BEB-001",
            "barcode": barcode,
            "price": 2500,
            "stock": 12,
            "active": True,
            "category_ids": [],
        },
    )
    assert create_response.status_code == 201
    assert create_response.json()["barcode"] == barcode

    lookup_response = client.get(f"/api/products/lookup?code={barcode}")
    assert lookup_response.status_code == 200
    assert lookup_response.json()["name"] == "Gaseosa"


def test_lookup_product_by_sku_and_reject_duplicate_identifiers(client: TestClient) -> None:
    first_response = client.post(
        "/api/products",
        json={
            "name": "Yerba",
            "sku": "ALM-001",
            "barcode": "7790000000001",
            "price": 3200,
            "stock": 4,
            "active": True,
            "category_ids": [],
        },
    )
    assert first_response.status_code == 201

    lookup_response = client.get("/api/products/lookup?code=ALM-001")
    assert lookup_response.status_code == 200
    assert lookup_response.json()["name"] == "Yerba"

    duplicate_response = client.post(
        "/api/products",
        json={
            "name": "Producto duplicado",
            "barcode": "ALM-001",
            "price": 100,
            "stock": 1,
            "active": True,
            "category_ids": [],
        },
    )
    assert duplicate_response.status_code == 400
    assert "codigo de barras" in duplicate_response.json()["detail"]


def test_lookup_does_not_return_inactive_product(client: TestClient) -> None:
    create_response = client.post(
        "/api/products",
        json={
            "name": "Producto discontinuado",
            "barcode": "7790000000002",
            "price": 100,
            "stock": 1,
            "active": True,
            "category_ids": [],
        },
    )
    product_id = create_response.json()["id"]
    client.delete(f"/api/products/{product_id}")

    lookup_response = client.get("/api/products/lookup?code=7790000000002")
    assert lookup_response.status_code == 404
