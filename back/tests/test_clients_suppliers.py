from fastapi.testclient import TestClient


def test_create_and_soft_delete_client(client: TestClient) -> None:
    create_response = client.post(
        "/api/clients",
        json={
            "dni": "12345678",
            "name": "Juan Perez",
            "phone": "1122334455",
            "active": True,
        },
    )
    assert create_response.status_code == 201
    client_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/clients/{client_id}")
    assert delete_response.status_code == 204

    list_response = client.get("/api/clients")
    assert list_response.status_code == 200
    assert list_response.json() == []

    include_inactive_response = client.get("/api/clients?include_inactive=true")
    assert include_inactive_response.status_code == 200
    assert len(include_inactive_response.json()) == 1
    assert include_inactive_response.json()[0]["active"] is False


def test_create_supplier_with_products_and_update_relations(client: TestClient) -> None:
    product_response = client.post(
        "/api/products",
        json={
            "name": "Pantalon Cargo",
            "price": 42000,
            "stock": 5,
            "active": True,
            "category_ids": [],
        },
    )
    product_id = product_response.json()["id"]

    supplier_response = client.post(
        "/api/suppliers",
        json={
            "name": "Mayorista Centro",
            "phone": "1144556677",
            "email": "ventas@mayoristacentro.test",
            "address": "Calle 123",
            "product_ids": [product_id],
        },
    )
    assert supplier_response.status_code == 201
    supplier_payload = supplier_response.json()
    supplier_id = supplier_payload["id"]
    assert len(supplier_payload["products"]) == 1
    assert supplier_payload["products"][0]["name"] == "Pantalon Cargo"

    update_response = client.patch(
        f"/api/suppliers/{supplier_id}",
        json={
            "address": "Calle 456",
            "product_ids": [],
        },
    )
    assert update_response.status_code == 200
    update_payload = update_response.json()
    assert update_payload["address"] == "Calle 456"
    assert update_payload["products"] == []
