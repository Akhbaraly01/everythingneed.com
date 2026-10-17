# EverythingNeed Page Implementation Matrix

Generated 2026-10-15: 274 Inertia pages crossed with web routes and API usage.
Auth model: A=authenticated (+V email-verified); admin pages role-gated; RENDER state means component resolves, actions verified per linked tests.

### Cms/Show
- file: resources/js/pages/Cms/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### Dashboard
- file: resources/js/pages/Dashboard.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### Home/Index
- file: resources/js/pages/Home/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /needs/request; /register
- states: form=False loading=False empty=True error=False

### Wishlist
- file: resources/js/pages/Wishlist.tsx
- web routes: GET /account/wishlist; GET /wishlist
- api calls: /api/wishlist; /api/wishlist/${id}
- links out: /products
- states: form=False loading=True empty=True error=True

### account/Addresses
- file: resources/js/pages/account/Addresses.tsx
- web routes: GET /account/addresses
- api calls: /api/addresses; /api/addresses/${id}; /api/addresses/${id}/default
- links out: none found
- states: form=True loading=True empty=True error=True

### account/Applications
- file: resources/js/pages/account/Applications.tsx
- web routes: GET /account/applications
- api calls: /api/jobs/my-applications; /api/my-task-applications
- links out: none found
- states: form=False loading=True empty=True error=True

### account/BookingDetail
- file: resources/js/pages/account/BookingDetail.tsx
- web routes: GET /account/bookings/{id}
- api calls: none (static/server props)
- links out: /account/bookings
- states: form=False loading=True empty=False error=True

### account/Bookings
- file: resources/js/pages/account/Bookings.tsx
- web routes: GET /account/bookings
- api calls: /api/bookings
- links out: /flights; /healthcare; /hotels
- states: form=False loading=True empty=True error=True

### account/ChangePassword
- file: resources/js/pages/account/ChangePassword.tsx
- web routes: GET /account/change-password
- api calls: /api/auth/change-password
- links out: none found
- states: form=True loading=False empty=False error=True

### account/Dashboard
- file: resources/js/pages/account/Dashboard.tsx
- web routes: GET /account/dashboard
- api calls: /api/user/stats
- links out: none found
- states: form=False loading=True empty=False error=True

### account/FinancialServices
- file: resources/js/pages/account/FinancialServices.tsx
- web routes: GET /account/financial-services
- api calls: none (static/server props)
- links out: /bills
- states: form=False loading=True empty=True error=True

### account/HealthcareHistory
- file: resources/js/pages/account/HealthcareHistory.tsx
- web routes: GET /account/healthcare-history
- api calls: /api/health/consultations; /api/health/tickets
- links out: none found
- states: form=False loading=True empty=True error=False

### account/Index
- file: resources/js/pages/account/Index.tsx
- web routes: GET /account
- api calls: /api/user/stats
- links out: none found
- states: form=False loading=True empty=False error=True

### account/PaymentMethods
- file: resources/js/pages/account/PaymentMethods.tsx
- web routes: GET /account/payment-methods
- api calls: /api/payment-methods; /api/payment-methods/${id}; /api/payments/methods
- links out: none found
- states: form=True loading=True empty=True error=True

### account/Privacy
- file: resources/js/pages/account/Privacy.tsx
- web routes: GET /account/privacy
- api calls: /api/auth/me; /api/settings
- links out: none found
- states: form=True loading=True empty=False error=True

### account/Profile
- file: resources/js/pages/account/Profile.tsx
- web routes: GET /profile; GET /account/profile
- api calls: /api/profile
- links out: none found
- states: form=True loading=False empty=False error=True

### account/Reviews
- file: resources/js/pages/account/Reviews.tsx
- web routes: GET /account/reviews
- api calls: /api/reviews/${id}; /api/reviews/mine
- links out: none found
- states: form=False loading=True empty=False error=True

### account/Sessions
- file: resources/js/pages/account/Sessions.tsx
- web routes: GET /account/sessions
- api calls: /api/auth/tokens
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/AdminSettings
- file: resources/js/pages/admin/AdminSettings.tsx
- web routes: GET /settings
- api calls: /api/admin/feature-flags; /api/admin/settings; /api/admin/ui-texts
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Analytics
- file: resources/js/pages/admin/Analytics.tsx
- web routes: GET /analytics
- api calls: /api/admin/analytics/categories
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Approvals
- file: resources/js/pages/admin/Approvals.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/admin/approval-requests; /api/admin/products/${id}/${action}; /api/admin/roles
- links out: none found
- states: form=True loading=False empty=True error=True

### admin/AuditLogs
- file: resources/js/pages/admin/AuditLogs.tsx
- web routes: GET /audit-logs
- api calls: /api/admin/audit-logs/actions
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Brands
- file: resources/js/pages/admin/Brands.tsx
- web routes: GET /brands
- api calls: /api/admin/brands
- links out: none found
- states: form=True loading=False empty=True error=True

### admin/Building
- file: resources/js/pages/admin/Building.tsx
- web routes: GET /building
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Categories
- file: resources/js/pages/admin/Categories.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/categories; /api/categories/${editId}; /api/categories/${id}
- links out: none found
- states: form=True loading=False empty=True error=True

### admin/Cms
- file: resources/js/pages/admin/Cms.tsx
- web routes: GET /cms
- api calls: /api/admin/cms/announcements; /api/admin/cms/banners; /api/admin/cms/blog; /api/admin/cms/pages; /api/upload
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Dashboard
- file: resources/js/pages/admin/Dashboard.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /dashboard
- states: form=False loading=False empty=True error=True

### admin/Deliveries
- file: resources/js/pages/admin/Deliveries.tsx
- web routes: GET /deliveries
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Departments
- file: resources/js/pages/admin/Departments.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/admin/departments
- links out: none found
- states: form=True loading=False empty=True error=True

### admin/Finance
- file: resources/js/pages/admin/Finance.tsx
- web routes: GET /finance
- api calls: /api/admin/finance/summary; /api/admin/finance/transactions
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Food
- file: resources/js/pages/admin/Food.tsx
- web routes: GET /food
- api calls: /api/admin/restaurants
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Forms
- file: resources/js/pages/admin/Forms.tsx
- web routes: GET /forms
- api calls: /api/admin/forms; /api/admin/forms/${id}; /api/admin/forms/${id}/submissions
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Healthcare
- file: resources/js/pages/admin/Healthcare.tsx
- web routes: GET /healthcare/doctors
- api calls: /api/admin/healthcare/content; /api/admin/healthcare/labs; /api/admin/healthcare/service-requests/${deciding}; /api/appointments/${assigning}/assign-doctor; /api/doctors
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/HealthcareAid
- file: resources/js/pages/admin/HealthcareAid.tsx
- web routes: GET /healthcare/aid
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/HomeSections
- file: resources/js/pages/admin/HomeSections.tsx
- web routes: GET /home-sections
- api calls: /api/admin/home-sections; /api/admin/home-sections/reorder
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Hotels
- file: resources/js/pages/admin/Hotels.tsx
- web routes: GET /hotels
- api calls: /api/admin/hotels
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Inventory
- file: resources/js/pages/admin/Inventory.tsx
- web routes: GET /inventory
- api calls: /api/stock/${id}
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Jobs
- file: resources/js/pages/admin/Jobs.tsx
- web routes: GET /jobs
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Kyc
- file: resources/js/pages/admin/Kyc.tsx
- web routes: GET /kyc
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/LearnReview
- file: resources/js/pages/admin/LearnReview.tsx
- web routes: GET /learning/review
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Learning
- file: resources/js/pages/admin/Learning.tsx
- web routes: GET /learning/courses
- api calls: /api/admin/courses; /api/learn/posts-queue; /api/learn/posts/${id}/${action}
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Media
- file: resources/js/pages/admin/Media.tsx
- web routes: GET /media
- api calls: /api/admin/media
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Modules
- file: resources/js/pages/admin/Modules.tsx
- web routes: GET /modules
- api calls: /api/admin/modules; /api/admin/modules/${id}; /api/admin/modules/${id}/entries
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Navigation
- file: resources/js/pages/admin/Navigation.tsx
- web routes: GET /navigation
- api calls: /api/admin/navigations
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Needs
- file: resources/js/pages/admin/Needs.tsx
- web routes: GET /needs
- api calls: /api/admin/needs/disputes${status}; /api/admin/needs/disputes/${id}/resolve; /api/admin/needs/fraud-flags${status}; /api/admin/needs/fraud-flags/${id}/decide; /api/admin/needs/fraud-scan; /api/admin/needs/listings${status}; /api/admin/needs/listings/${id}/moderate; /api/admin/needs/offers${status}; /api/admin/needs/offers/${id}; /api/admin/needs/overview
- links out: /api/admin/needs/reports/requests/export
- states: form=True loading=True empty=True error=True

### admin/Newsletter
- file: resources/js/pages/admin/Newsletter.tsx
- web routes: GET /newsletter
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Notifications
- file: resources/js/pages/admin/Notifications.tsx
- web routes: GET /notifications
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/OrderDetail
- file: resources/js/pages/admin/OrderDetail.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /admin/orders
- states: form=True loading=False empty=True error=True

### admin/Orders
- file: resources/js/pages/admin/Orders.tsx
- web routes: GET /orders
- api calls: /api/admin/orders${params}; /api/admin/orders/${orderId}/status
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/PayoutDetail
- file: resources/js/pages/admin/PayoutDetail.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /admin/payouts
- states: form=False loading=False empty=True error=True

### admin/Payouts
- file: resources/js/pages/admin/Payouts.tsx
- web routes: GET /payouts
- api calls: /api/admin/finance/withdrawals; /api/admin/finance/withdrawals/${id}/process
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Pharmacy
- file: resources/js/pages/admin/Pharmacy.tsx
- web routes: GET /pharmacy
- api calls: /api/medicines
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Products
- file: resources/js/pages/admin/Products.tsx
- web routes: GET /products
- api calls: /api/admin/products/${id}/approve; /api/admin/products/${id}/reject; /api/admin/products/pending; /api/products; /api/products/${id}
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Rbac
- file: resources/js/pages/admin/Rbac.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/admin/rbac/${action}; /api/admin/rbac/matrix; /api/admin/rbac/scopes; /api/admin/rbac/scopes/${id}
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/RealEstate
- file: resources/js/pages/admin/RealEstate.tsx
- web routes: GET /real-estate
- api calls: /api/admin/properties
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Reports
- file: resources/js/pages/admin/Reports.tsx
- web routes: GET /reports
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Returns
- file: resources/js/pages/admin/Returns.tsx
- web routes: GET /returns
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Reviews
- file: resources/js/pages/admin/Reviews.tsx
- web routes: GET /reviews
- api calls: /api/admin/expert-reviews; /api/admin/reviews
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Services
- file: resources/js/pages/admin/Services.tsx
- web routes: GET /services
- api calls: /api/admin/services
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/Subscriptions
- file: resources/js/pages/admin/Subscriptions.tsx
- web routes: GET /subscriptions
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Support
- file: resources/js/pages/admin/Support.tsx
- web routes: GET /support/tickets; GET /support
- api calls: /api/admin/support/tickets
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/SupportDetail
- file: resources/js/pages/admin/SupportDetail.tsx
- web routes: GET /support/{id}
- api calls: /api/admin/departments; /api/admin/support/tickets/${ticket_id}; /api/admin/support/tickets/${ticket_id}/assign; /api/admin/users; /api/tickets/${ticket_id}/assign-department; /api/tickets/${ticket_id}/escalate; /api/tickets/${ticket_id}/reply; /api/tickets/${ticket_id}/status
- links out: /admin/support
- states: form=True loading=True empty=True error=True

### admin/System
- file: resources/js/pages/admin/System.tsx
- web routes: GET /system
- api calls: /api/admin/stats/system
- links out: none found
- states: form=False loading=True empty=False error=False

### admin/Transport
- file: resources/js/pages/admin/Transport.tsx
- web routes: GET /transport
- api calls: /api/admin/transport/flights
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/UserDetail
- file: resources/js/pages/admin/UserDetail.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/admin/roles
- links out: /admin/users
- states: form=True loading=False empty=True error=True

### admin/Users
- file: resources/js/pages/admin/Users.tsx
- web routes: GET /users
- api calls: /api/admin/permissions; /api/admin/roles; /api/admin/users; /api/admin/users${params}; /api/admin/users/${userId}/permissions; /api/admin/users/${userId}/role
- links out: none found
- states: form=True loading=True empty=True error=True

### admin/VendorDetail
- file: resources/js/pages/admin/VendorDetail.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /admin/orders; /admin/payouts; /admin/products; /admin/vendors
- states: form=False loading=False empty=True error=True

### admin/Vendors
- file: resources/js/pages/admin/Vendors.tsx
- web routes: GET /vendors
- api calls: /api/admin/vendors${params}
- links out: none found
- states: form=False loading=True empty=True error=True

### admin/Wallet
- file: resources/js/pages/admin/Wallet.tsx
- web routes: GET /wallet
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=True empty=True error=True

### agriculture/Farmers
- file: resources/js/pages/agriculture/Farmers.tsx
- web routes: GET /agriculture/farmers
- api calls: /api/vendors
- links out: /agriculture/products
- states: form=False loading=True empty=True error=True

### agriculture/Index
- file: resources/js/pages/agriculture/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /agriculture/products; /job-seekers?category=Agriculture; /tasks
- states: form=True loading=False empty=True error=False

### agriculture/Products
- file: resources/js/pages/agriculture/Products.tsx
- web routes: GET /agriculture/products
- api calls: /api/products
- links out: /products
- states: form=False loading=True empty=True error=False

### agriculture/Workers
- file: resources/js/pages/agriculture/Workers.tsx
- web routes: GET /agriculture/workers
- api calls: /api/building-services/workers
- links out: none found
- states: form=False loading=True empty=True error=False

### analytics/Index
- file: resources/js/pages/analytics/Index.tsx
- web routes: GET /analytics
- api calls: /api/analytics/my-summary
- links out: none found
- states: form=False loading=True empty=False error=False

### auth/ForgotPassword
- file: resources/js/pages/auth/ForgotPassword.tsx
- web routes: GET /forgot-password
- api calls: none (static/server props)
- links out: /login
- states: form=True loading=False empty=False error=False

### auth/Login
- file: resources/js/pages/auth/Login.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/auth/otp/email/request; /api/auth/otp/email/verify; /api/auth/otp/request; /api/auth/otp/verify
- links out: /forgot-password
- states: form=True loading=True empty=True error=False

### auth/Register
- file: resources/js/pages/auth/Register.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /login
- states: form=True loading=False empty=False error=False

### auth/ResetPassword
- file: resources/js/pages/auth/ResetPassword.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /login
- states: form=True loading=False empty=False error=False

### auth/Suspended
- file: resources/js/pages/auth/Suspended.tsx
- web routes: GET /suspended
- api calls: /api/appeals
- links out: /login
- states: form=True loading=False empty=False error=True

### auth/TwoFactorChallenge
- file: resources/js/pages/auth/TwoFactorChallenge.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=False error=False

### auth/VerifyEmail
- file: resources/js/pages/auth/VerifyEmail.tsx
- web routes: GET /email/verify
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### bills/Index
- file: resources/js/pages/bills/Index.tsx
- web routes: GET /bills
- api calls: /api/bills/purchase
- links out: /kyc
- states: form=True loading=True empty=True error=True

### building-services/Booking
- file: resources/js/pages/building-services/Booking.tsx
- web routes: GET /building-services/book
- api calls: /api/building-services/bookings
- links out: none found
- states: form=True loading=False empty=False error=True

### building-services/BookingDetails
- file: resources/js/pages/building-services/BookingDetails.tsx
- web routes: GET /building-services/bookings/{id}
- api calls: /api/building-services/bookings/${id}
- links out: none found
- states: form=False loading=True empty=False error=True

### building-services/Bookings
- file: resources/js/pages/building-services/Bookings.tsx
- web routes: GET /building-services/bookings
- api calls: /api/building-services/bookings
- links out: /building-services/book
- states: form=False loading=True empty=True error=True

### building-services/Index
- file: resources/js/pages/building-services/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/building-services/book
- links out: none found
- states: form=True loading=False empty=True error=True

### building-services/WorkerProfile
- file: resources/js/pages/building-services/WorkerProfile.tsx
- web routes: GET /building-services/workers/{id}
- api calls: /api/building-services/workers/${worker_id}
- links out: none found
- states: form=False loading=True empty=False error=False

### cart/Index
- file: resources/js/pages/cart/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/cart; /api/cart/coupon; /api/cart/items/${itemId}
- links out: /orders/checkout; /products
- states: form=True loading=True empty=True error=True

### categories/Index
- file: resources/js/pages/categories/Index.tsx
- web routes: GET /categories
- api calls: /api/categories; /api/categories/tree
- links out: none found
- states: form=False loading=True empty=True error=False

### categories/Show
- file: resources/js/pages/categories/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/categories/${category_id}
- links out: /categories
- states: form=False loading=True empty=True error=False

### deals/Category
- file: resources/js/pages/deals/Category.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/deals
- links out: /deals
- states: form=False loading=True empty=True error=False

### deals/Index
- file: resources/js/pages/deals/Index.tsx
- web routes: GET /deals
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### deals/Landing
- file: resources/js/pages/deals/Landing.tsx
- web routes: GET /deals/{slug}
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### deals/Show
- file: resources/js/pages/deals/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/deals/${id}; /api/needs/saved
- links out: /needs/request
- states: form=False loading=True empty=False error=True

### deliveries/Index
- file: resources/js/pages/deliveries/Index.tsx
- web routes: GET /deliveries
- api calls: /api/delivery/${id}/transition; /api/delivery/history; /api/delivery/managers; /api/delivery/queue
- links out: none found
- states: form=True loading=True empty=True error=True

### errors/404
- file: resources/js/pages/errors/404.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /products; /tickets
- states: form=False loading=False empty=False error=False

### experts/Book
- file: resources/js/pages/experts/Book.tsx
- web routes: GET /experts/{id}/book
- api calls: /api/experts/${expert_id}; /api/experts/${expert_id}/book
- links out: none found
- states: form=True loading=True empty=False error=True

### experts/Bookings
- file: resources/js/pages/experts/Bookings.tsx
- web routes: GET /experts/bookings
- api calls: /api/experts/bookings; /api/experts/bookings/${id}/cancel
- links out: /experts
- states: form=False loading=True empty=True error=True

### experts/Index
- file: resources/js/pages/experts/Index.tsx
- web routes: GET /experts
- api calls: /api/experts
- links out: none found
- states: form=False loading=True empty=True error=False

### experts/Show
- file: resources/js/pages/experts/Show.tsx
- web routes: GET /experts/{id}
- api calls: /api/experts/${expert_id}; /api/experts/${expert_id}/availability; /api/experts/${expert_id}/review
- links out: /experts; /experts/bookings
- states: form=True loading=True empty=True error=True

### flights/Confirmation
- file: resources/js/pages/flights/Confirmation.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /bookings; /flights
- states: form=False loading=False empty=False error=False

### flights/MyBookings
- file: resources/js/pages/flights/MyBookings.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/bookings/${id}/cancel
- links out: /flights
- states: form=False loading=False empty=True error=True

### flights/Search
- file: resources/js/pages/flights/Search.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=True error=False

### flights/Show
- file: resources/js/pages/flights/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /flights
- states: form=True loading=False empty=False error=True

### food/Cart
- file: resources/js/pages/food/Cart.tsx
- web routes: GET /food/cart
- api calls: none (static/server props)
- links out: /food; /food/checkout
- states: form=False loading=True empty=True error=False

### food/Checkout
- file: resources/js/pages/food/Checkout.tsx
- web routes: GET /food/checkout
- api calls: /api/food/orders
- links out: none found
- states: form=True loading=True empty=True error=True

### food/Index
- file: resources/js/pages/food/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### food/OrderHistory
- file: resources/js/pages/food/OrderHistory.tsx
- web routes: GET /food/order-history
- api calls: /api/food/orders
- links out: /food
- states: form=False loading=True empty=True error=True

### food/OrderTracking
- file: resources/js/pages/food/OrderTracking.tsx
- web routes: GET /food/orders/{id}
- api calls: /api/food/orders/${id}
- links out: /food
- states: form=False loading=True empty=False error=False

### food/Show
- file: resources/js/pages/food/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=False

### forms/Show
- file: resources/js/pages/forms/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=True error=True

### healthcare/Aid
- file: resources/js/pages/healthcare/Aid.tsx
- web routes: GET /healthcare/aid
- api calls: none (static/server props)
- links out: /healthcare; /healthcare/aid/mine; /healthcare/bookings; /healthcare/documents; /healthcare/labs
- states: form=True loading=True empty=True error=True

### healthcare/AidDetail
- file: resources/js/pages/healthcare/AidDetail.tsx
- web routes: GET /healthcare/aid/{id}
- api calls: /api/health/aid/${aid_id}; /api/health/aid/${aid_id}/donate
- links out: /healthcare; /healthcare/aid; /healthcare/bookings
- states: form=True loading=True empty=False error=True

### healthcare/AppointmentShow
- file: resources/js/pages/healthcare/AppointmentShow.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /healthcare/appointments
- states: form=False loading=False empty=False error=True

### healthcare/Appointments
- file: resources/js/pages/healthcare/Appointments.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/appointments
- links out: /healthcare/bookings; /healthcare/doctors; /healthcare/records
- states: form=False loading=True empty=True error=True

### healthcare/Book
- file: resources/js/pages/healthcare/Book.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/appointments
- links out: /healthcare/doctors
- states: form=True loading=False empty=True error=True

### healthcare/BookingConfirmation
- file: resources/js/pages/healthcare/BookingConfirmation.tsx
- web routes: GET /healthcare/booking-confirmation; GET /healthcare/lab-confirmation
- api calls: /api/appointments/${id}; /api/health/labs/bookings/${id}; /api/health/tickets/${id}
- links out: none found
- states: form=False loading=True empty=False error=False

### healthcare/Bookings
- file: resources/js/pages/healthcare/Bookings.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/pharmacy/orders
- links out: /healthcare; /healthcare/aid; /healthcare/appointments; /healthcare/bookings/home-visit; /healthcare/bookings/others; /healthcare/doctors; /healthcare/documents; /healthcare/labs; /healthcare/labs/bookings; /healthcare/prescriptions; /healthcare/records; /healthcare/virtual
- states: form=False loading=False empty=True error=True

### healthcare/Content
- file: resources/js/pages/healthcare/Content.tsx
- web routes: GET /healthcare/videos; GET /healthcare/guides
- api calls: /api/healthcare/documents; /api/healthcare/prevention-guides; /api/healthcare/videos
- links out: /healthcare; /healthcare/documents
- states: form=False loading=True empty=True error=False

### healthcare/DoctorAvailability
- file: resources/js/pages/healthcare/DoctorAvailability.tsx
- web routes: GET /healthcare/doctors/{id}/availability
- api calls: /api/doctors/${doctor_id}; /api/doctors/${doctor_id}/availability
- links out: none found
- states: form=False loading=True empty=False error=True

### healthcare/DoctorProfile
- file: resources/js/pages/healthcare/DoctorProfile.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /healthcare/doctors
- states: form=False loading=False empty=False error=False

### healthcare/DoctorReviews
- file: resources/js/pages/healthcare/DoctorReviews.tsx
- web routes: GET /healthcare/doctors/{id}/reviews
- api calls: /api/doctors/${doctor_id}; /api/reviews
- links out: none found
- states: form=True loading=True empty=True error=True

### healthcare/Doctors
- file: resources/js/pages/healthcare/Doctors.tsx
- web routes: GET /healthcare/doctors
- api calls: /api/doctors${query}
- links out: none found
- states: form=False loading=True empty=True error=True

### healthcare/Documentation
- file: resources/js/pages/healthcare/Documentation.tsx
- web routes: GET /healthcare/documents
- api calls: /api/healthcare/documents; /api/healthcare/prevention-guides; /api/healthcare/videos
- links out: /healthcare; /healthcare/aid; /healthcare/bookings; /healthcare/labs
- states: form=False loading=True empty=True error=False

### healthcare/HealthServices
- file: resources/js/pages/healthcare/HealthServices.tsx
- web routes: GET /healthcare/health-services
- api calls: /api/health/emergency
- links out: /tickets
- states: form=False loading=False empty=False error=True

### healthcare/HomeVisit
- file: resources/js/pages/healthcare/HomeVisit.tsx
- web routes: GET /healthcare/bookings/home-visit
- api calls: /api/appointments; /api/health/doctors${query}
- links out: /healthcare/bookings
- states: form=True loading=True empty=True error=True

### healthcare/Index
- file: resources/js/pages/healthcare/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /healthcare/doctors; /pharmacy
- states: form=False loading=False empty=True error=False

### healthcare/LabBooking
- file: resources/js/pages/healthcare/LabBooking.tsx
- web routes: GET /healthcare/labs/{id}/book
- api calls: /api/health/labs/${test_id}; /api/health/labs/book
- links out: none found
- states: form=True loading=True empty=False error=True

### healthcare/LabBookingDetail
- file: resources/js/pages/healthcare/LabBookingDetail.tsx
- web routes: GET /healthcare/labs/bookings/{id}
- api calls: /api/health/labs/bookings/${booking_id}; /api/health/labs/bookings/${booking_id}/cancel; /api/health/labs/bookings/${booking_id}/pay
- links out: /healthcare/labs/bookings
- states: form=False loading=True empty=False error=True

### healthcare/LabBookings
- file: resources/js/pages/healthcare/LabBookings.tsx
- web routes: GET /healthcare/labs/bookings
- api calls: none (static/server props)
- links out: /healthcare/bookings; /healthcare/labs
- states: form=False loading=True empty=True error=True

### healthcare/LabShow
- file: resources/js/pages/healthcare/LabShow.tsx
- web routes: GET /healthcare/labs/{id}
- api calls: /api/health/labs/${test_id}
- links out: /healthcare/labs
- states: form=False loading=True empty=True error=True

### healthcare/Labs
- file: resources/js/pages/healthcare/Labs.tsx
- web routes: GET /healthcare/labs
- api calls: /api/health/labs
- links out: /healthcare; /healthcare/aid; /healthcare/bookings; /healthcare/labs/bookings
- states: form=False loading=True empty=True error=True

### healthcare/MyAid
- file: resources/js/pages/healthcare/MyAid.tsx
- web routes: GET /healthcare/aid/mine
- api calls: /api/health/aid
- links out: /healthcare; /healthcare/aid; /healthcare/bookings
- states: form=True loading=True empty=True error=True

### healthcare/MyHealthTickets
- file: resources/js/pages/healthcare/MyHealthTickets.tsx
- web routes: GET /healthcare/tickets
- api calls: /api/health/tickets
- links out: /healthcare/doctors
- states: form=False loading=True empty=True error=True

### healthcare/Prescriptions
- file: resources/js/pages/healthcare/Prescriptions.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /healthcare/appointments; /healthcare/bookings; /healthcare/records
- states: form=False loading=False empty=True error=True

### healthcare/ProviderDetail
- file: resources/js/pages/healthcare/ProviderDetail.tsx
- web routes: GET /healthcare/providers/{id}
- api calls: /api/doctors/${provider_id}; /api/health/labs/${provider_id}
- links out: /healthcare/providers
- states: form=False loading=True empty=True error=False

### healthcare/Providers
- file: resources/js/pages/healthcare/Providers.tsx
- web routes: GET /healthcare/providers
- api calls: /api/health/labs
- links out: /healthcare/pharmacy
- states: form=False loading=True empty=True error=True

### healthcare/Records
- file: resources/js/pages/healthcare/Records.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /healthcare/appointments; /healthcare/bookings; /healthcare/prescriptions
- states: form=False loading=False empty=True error=False

### healthcare/Search
- file: resources/js/pages/healthcare/Search.tsx
- web routes: GET /healthcare/search
- api calls: /api/health/labs
- links out: none found
- states: form=True loading=True empty=True error=True

### healthcare/ServiceRequests
- file: resources/js/pages/healthcare/ServiceRequests.tsx
- web routes: GET /healthcare/bookings/others
- api calls: /api/health/service-requests
- links out: /healthcare/bookings
- states: form=True loading=True empty=True error=True

### healthcare/Specialty
- file: resources/js/pages/healthcare/Specialty.tsx
- web routes: GET /healthcare/specialty/{specialty}
- api calls: none (static/server props)
- links out: /healthcare
- states: form=False loading=True empty=True error=False

### healthcare/VirtualConsultation
- file: resources/js/pages/healthcare/VirtualConsultation.tsx
- web routes: GET /healthcare/virtual
- api calls: /api/health/tickets
- links out: none found
- states: form=True loading=True empty=True error=True

### hotels/Booking
- file: resources/js/pages/hotels/Booking.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=False error=True

### hotels/Index
- file: resources/js/pages/hotels/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### hotels/ReservationDetail
- file: resources/js/pages/hotels/ReservationDetail.tsx
- web routes: GET /hotels/bookings/{id}
- api calls: /api/hotels/bookings/${reservation_id}
- links out: /hotels/bookings
- states: form=False loading=True empty=False error=True

### hotels/Reservations
- file: resources/js/pages/hotels/Reservations.tsx
- web routes: GET /hotels/reservations; GET /hotels/bookings
- api calls: /api/hotels/reservations/${id}/cancel; /api/hotels/reservations/mine
- links out: /hotels
- states: form=False loading=True empty=True error=True

### hotels/RoomDetails
- file: resources/js/pages/hotels/RoomDetails.tsx
- web routes: GET /hotels/{id}/rooms/{roomId}
- api calls: /api/hotels/${hotel_id}/rooms/${room_id}
- links out: none found
- states: form=False loading=True empty=False error=False

### hotels/Show
- file: resources/js/pages/hotels/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=False

### inventory/Index
- file: resources/js/pages/inventory/Index.tsx
- web routes: GET /inventory
- api calls: /api/stock
- links out: none found
- states: form=False loading=True empty=True error=False

### job-seekers/CreateRequest
- file: resources/js/pages/job-seekers/CreateRequest.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/work-requests
- links out: none found
- states: form=True loading=False empty=False error=True

### job-seekers/Index
- file: resources/js/pages/job-seekers/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /job-seekers/my-requests
- states: form=True loading=False empty=True error=False

### job-seekers/MyRequests
- file: resources/js/pages/job-seekers/MyRequests.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /job-seekers
- states: form=False loading=False empty=True error=True

### job-seekers/Show
- file: resources/js/pages/job-seekers/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /job-seekers
- states: form=False loading=False empty=False error=False

### jobs/ApplicationDetail
- file: resources/js/pages/jobs/ApplicationDetail.tsx
- web routes: GET /jobs/applications/{id}
- api calls: /api/jobs/applications/${application_id}
- links out: /jobs/applications
- states: form=False loading=True empty=False error=True

### jobs/Applications
- file: resources/js/pages/jobs/Applications.tsx
- web routes: GET /jobs/applications
- api calls: /api/jobs/my-applications
- links out: /jobs
- states: form=False loading=True empty=True error=True

### jobs/Apply
- file: resources/js/pages/jobs/Apply.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=False error=True

### jobs/Create
- file: resources/js/pages/jobs/Create.tsx
- web routes: GET /jobs/create
- api calls: /api/jobs
- links out: none found
- states: form=True loading=False empty=False error=True

### jobs/Index
- file: resources/js/pages/jobs/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /jobs/create
- states: form=False loading=False empty=True error=False

### jobs/MyJobs
- file: resources/js/pages/jobs/MyJobs.tsx
- web routes: GET /jobs/my-jobs
- api calls: none (static/server props)
- links out: /jobs/create
- states: form=False loading=True empty=False error=True

### jobs/Profile
- file: resources/js/pages/jobs/Profile.tsx
- web routes: GET /jobs/profile
- api calls: /api/jobs/profile
- links out: /jobs/create
- states: form=False loading=True empty=True error=True

### jobs/Search
- file: resources/js/pages/jobs/Search.tsx
- web routes: GET /jobs/search
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=True empty=True error=True

### jobs/Show
- file: resources/js/pages/jobs/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=True

### kyc/Submit
- file: resources/js/pages/kyc/Submit.tsx
- web routes: GET /account/kyc; GET /kyc
- api calls: /api/kyc; /api/kyc/submit; /api/upload
- links out: /wallet
- states: form=True loading=True empty=False error=True

### learn/Catalog
- file: resources/js/pages/learn/Catalog.tsx
- web routes: GET /learn/courses
- api calls: /api/course-categories
- links out: none found
- states: form=True loading=True empty=True error=False

### learn/Categories
- file: resources/js/pages/learn/Categories.tsx
- web routes: GET /learn/categories
- api calls: /api/course-categories
- links out: none found
- states: form=False loading=True empty=True error=True

### learn/Category
- file: resources/js/pages/learn/Category.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/course-categories
- links out: /learn/categories
- states: form=False loading=True empty=True error=False

### learn/CertificateDetail
- file: resources/js/pages/learn/CertificateDetail.tsx
- web routes: GET /learn/certificates/{id}
- api calls: /api/learn/certificates/${certificate_id}
- links out: /learn/certificates
- states: form=False loading=True empty=False error=True

### learn/Certificates
- file: resources/js/pages/learn/Certificates.tsx
- web routes: GET /account/certificates; GET /learn/certificates
- api calls: /api/learn/my-certificates
- links out: none found
- states: form=False loading=True empty=True error=True

### learn/Feed
- file: resources/js/pages/learn/Feed.tsx
- web routes: GET /learn/feed
- api calls: /api/learn/comments/${commentId}/like; /api/learn/posts; /api/learn/posts-mine; /api/learn/posts/${editingId}; /api/learn/posts/${id}/comments; /api/learn/posts/${postId}/comments
- links out: /login
- states: form=True loading=True empty=True error=True

### learn/Index
- file: resources/js/pages/learn/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/course-categories; /api/courses/${courseId}/enroll; /api/learn/my-certificates; /api/learn/posts
- links out: /learn/categories; /learn/certificates; /learn/courses; /learn/feed; /learn/feed?type=video; /learn/instructors; /learn/my-learning; /learn/progress; /learn/search
- states: form=True loading=True empty=True error=True

### learn/InstructorProfile
- file: resources/js/pages/learn/InstructorProfile.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/learn/instructors/${instructor_id}
- links out: none found
- states: form=False loading=True empty=True error=True

### learn/Instructors
- file: resources/js/pages/learn/Instructors.tsx
- web routes: GET /learn/instructors
- api calls: /api/learn/instructors
- links out: none found
- states: form=False loading=True empty=True error=True

### learn/Lesson
- file: resources/js/pages/learn/Lesson.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=False error=True

### learn/MyLearning
- file: resources/js/pages/learn/MyLearning.tsx
- web routes: GET /account/learning; GET /learn/my-learning
- api calls: /api/my-courses
- links out: /learn
- states: form=False loading=True empty=True error=True

### learn/Progress
- file: resources/js/pages/learn/Progress.tsx
- web routes: GET /learn/progress
- api calls: /api/my-courses
- links out: /learn/courses
- states: form=False loading=True empty=False error=True

### learn/Quiz
- file: resources/js/pages/learn/Quiz.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /learn/certificates
- states: form=True loading=False empty=True error=True

### learn/QuizResults
- file: resources/js/pages/learn/QuizResults.tsx
- web routes: GET /learn/quiz-results
- api calls: /api/learn/quiz-results
- links out: /learn
- states: form=False loading=True empty=True error=True

### learn/Search
- file: resources/js/pages/learn/Search.tsx
- web routes: GET /learn/search
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=True empty=True error=True

### learn/Show
- file: resources/js/pages/learn/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/reviews
- links out: /login
- states: form=True loading=False empty=True error=True

### learn/VerifyCertificate
- file: resources/js/pages/learn/VerifyCertificate.tsx
- web routes: GET /certificates/verify/{code}
- api calls: /api/learn/certificates/verify/${code}
- links out: none found
- states: form=False loading=True empty=True error=True

### learn/Watch
- file: resources/js/pages/learn/Watch.tsx
- web routes: GET /learn/watch/{id}
- api calls: /api/learn/comments/${commentId}/like; /api/learn/posts/${post_id}; /api/learn/posts/${post_id}/comments
- links out: /learn/feed; /login
- states: form=True loading=True empty=True error=True

### messages/Index
- file: resources/js/pages/messages/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/chat/conversations
- links out: none found
- states: form=True loading=False empty=True error=True

### messages/Show
- file: resources/js/pages/messages/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /messages
- states: form=True loading=False empty=True error=True

### needs/Category
- file: resources/js/pages/needs/Category.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /needs
- states: form=False loading=False empty=True error=False

### needs/History
- file: resources/js/pages/needs/History.tsx
- web routes: GET /needs/history
- api calls: /api/need-requests
- links out: /needs/request
- states: form=False loading=True empty=True error=True

### needs/Index
- file: resources/js/pages/needs/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /needs/create
- states: form=True loading=False empty=True error=False

### needs/MyNeeds
- file: resources/js/pages/needs/MyNeeds.tsx
- web routes: GET /account/needs; GET /needs/my-needs
- api calls: /api/need-requests; /api/needs/saved; /api/needs/saved/${id}
- links out: /needs/create
- states: form=False loading=True empty=True error=True

### needs/Request
- file: resources/js/pages/needs/Request.tsx
- web routes: GET /needs/request; GET /needs/create
- api calls: /api/need-categories; /api/need-requests; /api/need-requests/${editId}; /api/upload
- links out: /needs
- states: form=True loading=True empty=False error=True

### needs/Show
- file: resources/js/pages/needs/Show.tsx
- web routes: GET /needs/requests/{id}; GET /needs/{category}/{id}
- api calls: /api/need-requests/${id}; /api/need-requests/${id}/${path}; /api/need-requests/${id}/offers; /api/need-requests/${id}/offers/${offerId}/${action}
- links out: /needs
- states: form=True loading=True empty=True error=True

### needs/my/Messages
- file: resources/js/pages/needs/my/Messages.tsx
- web routes: GET /needs/my-needs/{id}/messages
- api calls: /api/chat/${convId}/messages; /api/chat/${conversationId}/messages; /api/chat/conversations; /api/need-requests/${need_id}
- links out: none found
- states: form=True loading=True empty=True error=True

### needs/my/Offers
- file: resources/js/pages/needs/my/Offers.tsx
- web routes: GET /needs/my-needs/{id}/offers
- api calls: /api/need-requests/${need_id}; /api/need-requests/${need_id}/matches; /api/need-requests/${need_id}/offers/${offerId}/${action}; /api/need-requests/${need_id}/offers/${offerId}/withdraw
- links out: none found
- states: form=False loading=True empty=True error=True

### needs/my/Overview
- file: resources/js/pages/needs/my/Overview.tsx
- web routes: GET /account/needs/{id}; GET /needs/my-needs/{id}
- api calls: /api/need-requests/${need_id}; /api/need-requests/${need_id}/${action}; /api/need-requests/${need_id}/duplicate; /api/need-requests/${need_id}/visibility
- links out: /needs/my-needs
- states: form=False loading=True empty=True error=True

### needs/my/Payment
- file: resources/js/pages/needs/my/Payment.tsx
- web routes: GET /needs/my-needs/{id}/payment
- api calls: /api/need-requests/${need_id}; /api/need-requests/${need_id}/pay
- links out: none found
- states: form=False loading=True empty=True error=True

### needs/my/Review
- file: resources/js/pages/needs/my/Review.tsx
- web routes: GET /needs/my-needs/{id}/review
- api calls: /api/need-requests/${need_id}; /api/reviews
- links out: none found
- states: form=True loading=True empty=False error=True

### needs/my/Tracking
- file: resources/js/pages/needs/my/Tracking.tsx
- web routes: GET /needs/my-needs/{id}/tracking
- api calls: /api/need-requests/${need_id}; /api/need-requests/${need_id}/accept; /api/need-requests/${need_id}/bookings
- links out: none found
- states: form=False loading=False empty=True error=True

### notifications/Index
- file: resources/js/pages/notifications/Index.tsx
- web routes: GET /account/notifications; GET /notifications
- api calls: /api/notifications; /api/notifications/${id}; /api/notifications/${id}/read; /api/notifications/read-all
- links out: none found
- states: form=False loading=True empty=True error=True

### orders/Checkout
- file: resources/js/pages/orders/Checkout.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/cart; /api/payments/charge; /api/payments/methods; /api/product-orders
- links out: /orders; /products
- states: form=True loading=True empty=True error=True

### orders/Disputes
- file: resources/js/pages/orders/Disputes.tsx
- web routes: GET /orders/disputes
- api calls: /api/disputes
- links out: /orders
- states: form=True loading=True empty=True error=True

### orders/Index
- file: resources/js/pages/orders/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/product-orders/${orderId}/cancel
- links out: /products
- states: form=False loading=False empty=True error=True

### orders/Returns
- file: resources/js/pages/orders/Returns.tsx
- web routes: GET /orders/returns
- api calls: /api/returns
- links out: /orders
- states: form=True loading=True empty=True error=True

### orders/Show
- file: resources/js/pages/orders/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /orders
- states: form=False loading=False empty=False error=True

### orders/Tracking
- file: resources/js/pages/orders/Tracking.tsx
- web routes: GET /orders/{id}/tracking
- api calls: /api/orders/${id}/tracking
- links out: none found
- states: form=False loading=True empty=False error=False

### payments/Index
- file: resources/js/pages/payments/Index.tsx
- web routes: GET /payments
- api calls: /api/payments
- links out: none found
- states: form=False loading=True empty=True error=True

### permissions/Index
- file: resources/js/pages/permissions/Index.tsx
- web routes: GET /permissions
- api calls: /api/admin/permissions
- links out: none found
- states: form=False loading=True empty=True error=True

### pharmacy/Cart
- file: resources/js/pages/pharmacy/Cart.tsx
- web routes: GET /pharmacy/cart
- api calls: /api/pharmacy/orders
- links out: /pharmacy
- states: form=False loading=False empty=True error=True

### pharmacy/Checkout
- file: resources/js/pages/pharmacy/Checkout.tsx
- web routes: GET /pharmacy/checkout
- api calls: /api/pharmacy/orders
- links out: none found
- states: form=True loading=False empty=True error=True

### pharmacy/Index
- file: resources/js/pages/pharmacy/Index.tsx
- web routes: GET /healthcare/pharmacy; GET /healthcare/pharmacy/products; GET /pharmacy
- api calls: none (static/server props)
- links out: /pharmacy/cart
- states: form=True loading=True empty=True error=True

### pharmacy/OrderConfirmation
- file: resources/js/pages/pharmacy/OrderConfirmation.tsx
- web routes: GET /pharmacy/orders/{id}/confirmation
- api calls: /api/pharmacy/orders/${id}
- links out: /orders; /pharmacy
- states: form=False loading=True empty=False error=False

### pharmacy/OrderTracking
- file: resources/js/pages/pharmacy/OrderTracking.tsx
- web routes: GET /pharmacy/orders/{id}
- api calls: /api/pharmacy/orders/${id}
- links out: /pharmacy
- states: form=False loading=True empty=False error=False

### pharmacy/PrescriptionUpload
- file: resources/js/pages/pharmacy/PrescriptionUpload.tsx
- web routes: GET /pharmacy/prescription-upload
- api calls: /api/pharmacy/prescriptions
- links out: none found
- states: form=True loading=False empty=False error=True

### pharmacy/Show
- file: resources/js/pages/pharmacy/Show.tsx
- web routes: GET /healthcare/pharmacy/products/{id}; GET /pharmacy/products/{id}
- api calls: /api/medicines/${product_id}
- links out: /pharmacy; /pharmacy/cart
- states: form=False loading=True empty=False error=True

### products/Compare
- file: resources/js/pages/products/Compare.tsx
- web routes: GET /products/compare
- api calls: /api/compare/${id}; /api/products/comparison
- links out: none found
- states: form=False loading=True empty=True error=False

### products/Index
- file: resources/js/pages/products/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/cart/items
- links out: none found
- states: form=True loading=False empty=True error=False

### products/RecentlyViewed
- file: resources/js/pages/products/RecentlyViewed.tsx
- web routes: GET /recently-viewed
- api calls: none (static/server props)
- links out: /products
- states: form=False loading=False empty=False error=False

### products/Reviews
- file: resources/js/pages/products/Reviews.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=False

### products/Show
- file: resources/js/pages/products/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/cart/items; /api/compare
- links out: /products
- states: form=False loading=False empty=True error=True

### products/Vendor
- file: resources/js/pages/products/Vendor.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=False

### properties/Create
- file: resources/js/pages/properties/Create.tsx
- web routes: GET /properties/create; GET /real-estate/create
- api calls: /api/properties
- links out: /properties
- states: form=True loading=False empty=False error=True

### properties/Index
- file: resources/js/pages/properties/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### properties/Inquiry
- file: resources/js/pages/properties/Inquiry.tsx
- web routes: GET /real-estate/{id}/inquiry; GET /properties/{id}/inquiry
- api calls: /api/properties/${id}/inquiries
- links out: none found
- states: form=True loading=False empty=False error=True

### properties/MyListings
- file: resources/js/pages/properties/MyListings.tsx
- web routes: GET /real-estate/my-listings; GET /properties/my-listings
- api calls: /api/properties/my-listings
- links out: /real-estate/create
- states: form=False loading=True empty=False error=True

### properties/Show
- file: resources/js/pages/properties/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### provider/Dashboard
- file: resources/js/pages/provider/Dashboard.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /jobs; /tasks
- states: form=False loading=False empty=True error=False

### provider/NeedsHub
- file: resources/js/pages/provider/NeedsHub.tsx
- web routes: GET /provider/needs
- api calls: /api/my-listings; /api/my-offers; /api/my-work
- links out: /provider/profile
- states: form=False loading=True empty=True error=False

### provider/Profile
- file: resources/js/pages/provider/Profile.tsx
- web routes: GET /provider/profile
- api calls: /api/need-categories; /api/provider-profile
- links out: none found
- states: form=True loading=True empty=False error=True

### requests/Index
- file: resources/js/pages/requests/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /needs/request
- states: form=False loading=False empty=True error=True

### reviews/Create
- file: resources/js/pages/reviews/Create.tsx
- web routes: GET /reviews/create
- api calls: /api/reviews
- links out: none found
- states: form=True loading=False empty=False error=True

### reviews/Index
- file: resources/js/pages/reviews/Index.tsx
- web routes: GET /reviews
- api calls: /api/reviews${params}
- links out: none found
- states: form=False loading=True empty=True error=True

### scan/Index
- file: resources/js/pages/scan/Index.tsx
- web routes: GET /scan
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=True error=True

### search/Results
- file: resources/js/pages/search/Results.tsx
- web routes: GET /search
- api calls: none (static/server props)
- links out: /products
- states: form=True loading=True empty=True error=False

### settings/Index
- file: resources/js/pages/settings/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/profile
- links out: /forgot-password
- states: form=True loading=False empty=False error=False

### settings/Notifications
- file: resources/js/pages/settings/Notifications.tsx
- web routes: GET /settings/notifications
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=True

### settings/Security
- file: resources/js/pages/settings/Security.tsx
- web routes: GET /settings/security; GET /account/security
- api calls: /api/auth/change-password
- links out: none found
- states: form=True loading=False empty=False error=True

### stores/Index
- file: resources/js/pages/stores/Index.tsx
- web routes: GET /stores
- api calls: /api/vendors
- links out: none found
- states: form=False loading=True empty=True error=False

### stores/Show
- file: resources/js/pages/stores/Show.tsx
- web routes: GET /stores/{id}
- api calls: /api/vendors/${id}
- links out: /stores
- states: form=False loading=True empty=True error=False

### subscriptions/Index
- file: resources/js/pages/subscriptions/Index.tsx
- web routes: GET /subscriptions
- api calls: /api/my-subscription; /api/plans; /api/subscribe; /api/unsubscribe
- links out: none found
- states: form=True loading=True empty=True error=True

### tasks/Create
- file: resources/js/pages/tasks/Create.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/tasks
- links out: /tasks
- states: form=True loading=False empty=False error=True

### tasks/Index
- file: resources/js/pages/tasks/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /tasks/create; /tasks/my-applications
- states: form=True loading=False empty=True error=False

### tasks/MyApplications
- file: resources/js/pages/tasks/MyApplications.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /tasks
- states: form=False loading=False empty=True error=False

### tasks/Show
- file: resources/js/pages/tasks/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /tasks
- states: form=True loading=False empty=True error=True

### tasks/Submission
- file: resources/js/pages/tasks/Submission.tsx
- web routes: GET /tasks/{id}/submit
- api calls: none (static/server props)
- links out: none found
- states: form=True loading=False empty=True error=True

### tickets/Create
- file: resources/js/pages/tickets/Create.tsx
- web routes: GET /account/support/create
- api calls: /api/tickets
- links out: /account/support
- states: form=True loading=False empty=False error=True

### tickets/Index
- file: resources/js/pages/tickets/Index.tsx
- web routes: GET /account/support
- api calls: /api/tickets
- links out: /account/support/create
- states: form=False loading=True empty=True error=True

### tickets/Show
- file: resources/js/pages/tickets/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /account/support
- states: form=True loading=False empty=True error=True

### transportation/CustomRequest
- file: resources/js/pages/transportation/CustomRequest.tsx
- web routes: GET /transportation/custom-request
- api calls: /api/transport/requests
- links out: none found
- states: form=True loading=False empty=False error=True

### transportation/Index
- file: resources/js/pages/transportation/Index.tsx
- web routes: GET /transportation
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### transportation/RideBooking
- file: resources/js/pages/transportation/RideBooking.tsx
- web routes: GET /transportation/ride-booking
- api calls: /api/rides; /api/rides/available
- links out: none found
- states: form=True loading=True empty=False error=True

### transportation/RideTracking
- file: resources/js/pages/transportation/RideTracking.tsx
- web routes: GET /transportation/tracking/{id}
- api calls: /api/rides/${ride_id}
- links out: none found
- states: form=False loading=True empty=False error=False

### vendor/Analytics
- file: resources/js/pages/vendor/Analytics.tsx
- web routes: GET /vendor/analytics
- api calls: /api/vendor/earnings; /api/vendor/orders/top-products; /api/vendor/profile
- links out: none found
- states: form=False loading=True empty=False error=False

### vendor/Bookings
- file: resources/js/pages/vendor/Bookings.tsx
- web routes: GET /vendor/bookings
- api calls: /api/vendor/bookings
- links out: none found
- states: form=False loading=True empty=True error=True

### vendor/Dashboard
- file: resources/js/pages/vendor/Dashboard.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: /vendor/orders; /vendor/products
- states: form=False loading=False empty=True error=False

### vendor/Earnings
- file: resources/js/pages/vendor/Earnings.tsx
- web routes: GET /vendor/earnings
- api calls: /api/vendor/earnings
- links out: /vendor/payouts
- states: form=False loading=True empty=False error=True

### vendor/OrderDetails
- file: resources/js/pages/vendor/OrderDetails.tsx
- web routes: GET /vendor/orders/{id}
- api calls: /api/vendor/orders/${id}
- links out: none found
- states: form=False loading=True empty=True error=True

### vendor/Orders
- file: resources/js/pages/vendor/Orders.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=True

### vendor/Payouts
- file: resources/js/pages/vendor/Payouts.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/vendor/earnings; /api/vendor/payouts; /api/vendor/payouts/request
- links out: none found
- states: form=True loading=True empty=True error=True

### vendor/ProductCreate
- file: resources/js/pages/vendor/ProductCreate.tsx
- web routes: GET /vendor/products/create
- api calls: /api/vendor/products
- links out: none found
- states: form=True loading=False empty=False error=True

### vendor/ProductEdit
- file: resources/js/pages/vendor/ProductEdit.tsx
- web routes: GET /vendor/products/{id}/edit
- api calls: /api/products/${id}; /api/vendor/products/${id}
- links out: none found
- states: form=True loading=True empty=False error=True

### vendor/Products
- file: resources/js/pages/vendor/Products.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/products
- links out: none found
- states: form=True loading=False empty=True error=True

### vendor/Profile
- file: resources/js/pages/vendor/Profile.tsx
- web routes: GET /vendor/profile
- api calls: /api/vendor/profile
- links out: none found
- states: form=True loading=True empty=False error=True

### vendor/Reviews
- file: resources/js/pages/vendor/Reviews.tsx
- web routes: GET /vendor/reviews
- api calls: /api/vendor/reviews
- links out: /vendor/products
- states: form=False loading=True empty=True error=True

### vendor/ServiceCreate
- file: resources/js/pages/vendor/ServiceCreate.tsx
- web routes: GET /vendor/services/create
- api calls: /api/vendor/services
- links out: /vendor/services
- states: form=True loading=False empty=True error=True

### vendor/ServiceEdit
- file: resources/js/pages/vendor/ServiceEdit.tsx
- web routes: GET /vendor/services/{id}/edit
- api calls: /api/vendor/services/${service_id}
- links out: /vendor/services
- states: form=True loading=True empty=False error=True

### vendor/Services
- file: resources/js/pages/vendor/Services.tsx
- web routes: GET /vendor/services
- api calls: /api/vendor/services
- links out: /vendor/bookings; /vendor/services/create
- states: form=False loading=True empty=True error=True

### vendor/Settings
- file: resources/js/pages/vendor/Settings.tsx
- web routes: GET /vendor/settings
- api calls: /api/vendor/profile; /api/vendor/settings
- links out: none found
- states: form=False loading=True empty=False error=True

### vendors/Index
- file: resources/js/pages/vendors/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=False error=False

### vendors/Products
- file: resources/js/pages/vendors/Products.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=False

### vendors/Register
- file: resources/js/pages/vendors/Register.tsx
- web routes: GET /vendor/register
- api calls: /api/vendors
- links out: none found
- states: form=True loading=False empty=False error=True

### vendors/Reviews
- file: resources/js/pages/vendors/Reviews.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=False

### vendors/Services
- file: resources/js/pages/vendors/Services.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/bookings
- links out: none found
- states: form=True loading=False empty=True error=True

### vendors/Show
- file: resources/js/pages/vendors/Show.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: none (static/server props)
- links out: none found
- states: form=False loading=False empty=True error=False

### wallet/Deposit
- file: resources/js/pages/wallet/Deposit.tsx
- web routes: GET /account/wallet/deposit
- api calls: /api/wallet/deposit
- links out: /kyc; /wallet
- states: form=True loading=False empty=False error=True

### wallet/Index
- file: resources/js/pages/wallet/Index.tsx
- web routes: mounted dynamically or via alias (see route graph)
- api calls: /api/wallet/deposit; /api/wallet/withdraw
- links out: /kyc
- states: form=True loading=False empty=True error=True

### wallet/Transaction
- file: resources/js/pages/wallet/Transaction.tsx
- web routes: GET /wallet/transactions/{id}
- api calls: /api/wallet/transactions/${transaction_id}
- links out: /wallet
- states: form=False loading=True empty=False error=True

### wallet/Withdraw
- file: resources/js/pages/wallet/Withdraw.tsx
- web routes: GET /account/wallet/withdraw
- api calls: /api/wallet/available; /api/wallet/withdraw
- links out: /kyc; /wallet
- states: form=True loading=True empty=False error=True
