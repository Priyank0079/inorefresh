# Frontend-Backend Authentication Integration Test Report

**Generated:** 2026-03-19T07:31:43.193Z
**Backend URL:** http://localhost:5000
**Frontend URL:** http://localhost:5173/
**API Base:** http://localhost:5000/api/v1

## Summary

- **Total Tests:** 9
- **Passed:** 5 ✅
- **Failed:** 4 ❌
- **Skipped:** 0 ⏭️
- **Warnings:** 0 ⚠️
- **Success Rate:** 55.56%

## Test Suites

### API Health

- ✅ **API Health Check**: API is healthy
  - Endpoint: `GET /health`
  - Details: ```json
{
  "status": "OK",
  "message": "API is healthy",
  "timestamp": "2026-03-19T07:31:40.889Z"
}
```

### CORS Configuration

- ✅ **CORS - Preflight Request**: CORS headers present: http://localhost:5173/
  - Endpoint: `OPTIONS /auth/customer/send-otp`
  - Details: ```json
{
  "access-control-allow-origin": "http://localhost:5173/",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  "access-control-allow-headers": "Content-Type,Authorization,X-Requested-With,Accept,Origin",
  "access-control-allow-credentials": "true"
}
```
- ✅ **CORS - Actual Request**: CORS allows origin: http://localhost:5173/
  - Endpoint: `POST /auth/customer/send-otp`
  - Details: ```json
{
  "origin": "http://localhost:5173/"
}
```

### Admin Authentication Flow

- ✅ **Admin Send OTP**: OTP sent successfully
  - Endpoint: `POST /auth/admin/send-otp`
  - Details: ```json
{
  "message": "OTP sent successfully"
}
```
- ✅ **Admin Verify OTP**: OTP verified and token received
  - Endpoint: `POST /auth/admin/verify-otp`
  - Details: ```json
{
  "hasToken": true,
  "userData": {
    "id": "69bba65d3ed10564a3634bd8",
    "firstName": "Test",
    "lastName": "Admin",
    "mobile": "9000000001",
    "email": "testadmin1773905501332@test.com",
    "role": "Admin"
  }
}
```

### Error Handling

- ❌ **Error - Invalid Mobile Format**: Should reject invalid mobile format
  - Endpoint: `POST /auth/customer/send-otp`
  - Details: ```json
{
  "success": false,
  "message": "Route not found"
}
```
- ❌ **Error - Missing Required Fields**: Should reject missing required fields
  - Endpoint: `POST /auth/customer/register`
  - Details: ```json
{
  "success": false,
  "message": "Route not found"
}
```
- ❌ **Error - Invalid OTP**: Should reject invalid OTP
  - Endpoint: `POST /auth/customer/verify-otp`
  - Details: ```json
{
  "success": false,
  "message": "Route not found"
}
```

## All Test Results

- ✅ **API Health Check**: API is healthy
- ✅ **CORS - Preflight Request**: CORS headers present: http://localhost:5173/
- ✅ **CORS - Actual Request**: CORS allows origin: http://localhost:5173/
- ❌ **Customer Registration**: Registration failed
- ✅ **Admin Send OTP**: OTP sent successfully
- ✅ **Admin Verify OTP**: OTP verified and token received
- ❌ **Error - Invalid Mobile Format**: Should reject invalid mobile format
- ❌ **Error - Missing Required Fields**: Should reject missing required fields
- ❌ **Error - Invalid OTP**: Should reject invalid OTP
