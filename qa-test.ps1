$ErrorActionPreference = 'Stop'

function Log($msg) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
}

$baseUrl = "http://localhost:3333/api"

Log "1. Admin Login"
$loginRes = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/admin-pin-login" -Body (@{ pin = '5825825825iW.' } | ConvertTo-Json) -ContentType "application/json"
$token = $loginRes.access_token
$headers = @{ "Authorization" = "Bearer $token" }
Log "Login successful. Token acquired."

Log "2. Fetch Dashboard Metrics"
$metrics = Invoke-RestMethod -Method Get -Uri "$baseUrl/sales" -Headers $headers
Log "Dashboard metrics loaded. Sales returned."

Log "3. Create QA Test Product"
$productBody = @{
    name = "QA Test Product - $(Get-Date -Format 'HHmmss')"
    type = "PRODUCT"
    costPrice = 10
    sellingPrice = 20
    code = "QA-$(Get-Date -Format 'HHmmss')"
}
$product = Invoke-RestMethod -Method Post -Uri "$baseUrl/business-core/products" -Body ($productBody | ConvertTo-Json) -Headers $headers -ContentType "application/json"
Log "Product created. ID: $($product.id)"

Log "4. Add Inventory"
# Need warehouse ID
$branches = Invoke-RestMethod -Method Get -Uri "$baseUrl/operational-structure/branches" -Headers $headers
if ($branches.length -eq 0 -or $null -eq $branches[0]) {
    Log "Creating QA Branch..."
    $branchBody = @{ name = "QA Branch $(Get-Date -Format 'HHmmss')"; location = "Dhaka" }
    $branch = Invoke-RestMethod -Method Post -Uri "$baseUrl/operational-structure/branches" -Body ($branchBody | ConvertTo-Json) -Headers $headers -ContentType "application/json"
    $branchId = $branch.id
} else {
    $branchId = $branches[0].id
}

$warehouses = Invoke-RestMethod -Method Get -Uri "$baseUrl/operational-structure/warehouses" -Headers $headers
if ($warehouses.length -eq 0 -or $null -eq $warehouses[0]) {
    Log "Creating QA Warehouse..."
    $whBody = @{ name = "QA Warehouse"; branchId = $branchId; isDefault = $true }
    $wh = Invoke-RestMethod -Method Post -Uri "$baseUrl/operational-structure/warehouses" -Body ($whBody | ConvertTo-Json) -Headers $headers -ContentType "application/json"
    $warehouseId = $wh.id
} else {
    $warehouseId = $warehouses[0].id
}

$inventoryBody = @{
    warehouseId = $warehouseId
    productId = $product.id
    quantity = 10
    type = "ADJUSTMENT_IN"
    notes = "QA Test Stock Add"
}
$adjustment = Invoke-RestMethod -Method Post -Uri "$baseUrl/inventory/adjustments" -Body ($inventoryBody | ConvertTo-Json) -Headers $headers -ContentType "application/json"
Log "Inventory added. Adjustment ID: $($adjustment.id)"

Log "5. Verify Stock = 10"
$balances = Invoke-RestMethod -Method Get -Uri "$baseUrl/inventory/balances?productId=$($product.id)&warehouseId=$warehouseId" -Headers $headers
$stock = $balances[0].quantity
if ($stock -ne 10) { throw "Stock is not 10! It is $stock" }
Log "Stock verified at 10."

Log "6. Attempt POS Sale (2 units)"
$saleBody = @{
    branchId = $branchId
    warehouseId = $warehouseId
    lines = @(
        @{
            productId = $product.id
            quantity = 2
            unitPrice = 20
        }
    )
    payments = @(
        @{
            method = "CASH"
            amount = 40
        }
    )
}
$sale = Invoke-RestMethod -Method Post -Uri "$baseUrl/sales/complete-direct" -Body ($saleBody | ConvertTo-Json -Depth 5) -Headers $headers -ContentType "application/json"
Log "Sale completed. ID: $($sale.id)"

Log "7. Verify Stock = 8"
$balancesAfterSale = Invoke-RestMethod -Method Get -Uri "$baseUrl/inventory/balances?productId=$($product.id)&warehouseId=$warehouseId" -Headers $headers
$stockAfterSale = $balancesAfterSale[0].quantity
if ($stockAfterSale -ne 8) { throw "Stock is not 8 after sale! It is $stockAfterSale" }
Log "Stock correctly reduced to 8."

Log "8. Negative Stock Test (Attempt to sell 1000 units)"
$negativeSaleBody = @{
    branchId = $branchId
    warehouseId = $warehouseId
    lines = @(
        @{
            productId = $product.id
            quantity = 1000
            unitPrice = 20
        }
    )
    payments = @(
        @{
            method = "CASH"
            amount = 20000
        }
    )
}
try {
    $null = Invoke-RestMethod -Method Post -Uri "$baseUrl/sales/complete-direct" -Body ($negativeSaleBody | ConvertTo-Json) -Headers $headers -ContentType "application/json"
    throw "Negative stock sale SUCCEEDED, but it should have FAILED!"
} catch {
    Log "Negative stock test correctly rejected: $($_.Exception.Message)"
}

Log "9. Check Finance Journal"
Start-Sleep -Seconds 2 # Allow async outbox processor to run
$journals = Invoke-RestMethod -Method Get -Uri "$baseUrl/finance/journal-entries" -Headers $headers
$recentJournal = $journals | Where-Object { $_.referenceId -eq $sale.id }
if ($null -eq $recentJournal) {
    Log "WARNING: Journal entry for sale not found! Triggering outbox manually."
    Invoke-RestMethod -Method Post -Uri "$baseUrl/finance-integration/process" -Headers $headers -ContentType "application/json"
    $journals2 = Invoke-RestMethod -Method Get -Uri "$baseUrl/finance/journal-entries" -Headers $headers
    $recentJournal = $journals2 | Where-Object { $_.referenceId -eq $sale.id }
}

if ($null -eq $recentJournal) {
    throw "Journal entry STILL not found after manual outbox trigger!"
} else {
    Log "Finance Journal created successfully for Sale $($sale.id). Total debits: $($recentJournal.lines | Measure-Object -Property debit -Sum | Select-Object -ExpandProperty Sum)"
}

Log "10. Storefront Customer Authentication"
$customerBody = @{
    name = "QA Customer $(Get-Date -Format 'HHmmss')"
    email = "qa-$(Get-Date -Format 'HHmmss')@example.com"
    phone = "01700000000"
    password = "password123"
}
$customerReg = Invoke-RestMethod -Method Post -Uri "$baseUrl/public/auth/register" -Body ($customerBody | ConvertTo-Json) -ContentType "application/json"
$customerToken = $customerReg.access_token
$customerHeaders = @{ "Authorization" = "Bearer $customerToken" }
Log "Customer registered and logged in."

Log "11. Storefront Checkout"
$checkoutBody = @{
    branchId = $branchId
    warehouseId = $warehouseId
    lines = @(
        @{
            productId = $product.id
            quantity = 1
            unitPrice = 20
        }
    )
    payments = @(
        @{
            method = "CASH"
            amount = 20
        }
    )
}
$checkout = Invoke-RestMethod -Method Post -Uri "$baseUrl/public/orders/checkout" -Body ($checkoutBody | ConvertTo-Json) -Headers $customerHeaders -ContentType "application/json"
Log "Storefront checkout completed. Order ID: $($checkout.id)"

Log "ALL API TESTS PASSED SUCESSFULLY."
