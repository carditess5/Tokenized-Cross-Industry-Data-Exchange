;; Entity Verification Contract
;; Validates participating organizations in the data exchange

(define-data-var admin principal tx-sender)

;; Map to store verified entities
(define-map verified-entities principal
  {
    name: (string-utf8 100),
    industry: (string-utf8 50),
    verified: bool,
    verification-date: uint
  }
)

;; Public function to register a new entity
(define-public (register-entity (name (string-utf8 100)) (industry (string-utf8 50)))
  (let ((caller tx-sender))
    (if (map-insert verified-entities caller
          {
            name: name,
            industry: industry,
            verified: false,
            verification-date: u0
          })
        (ok true)
        (err u1) ;; Entity already exists
    )
  )
)

;; Admin function to verify an entity
(define-public (verify-entity (entity principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can verify
    (match (map-get? verified-entities entity)
      entity-data (begin
        (map-set verified-entities entity
          (merge entity-data {
            verified: true,
            verification-date: block-height
          })
        )
        (ok true)
      )
      (err u404) ;; Entity not found
    )
  )
)

;; Public function to check if an entity is verified
(define-read-only (is-verified (entity principal))
  (match (map-get? verified-entities entity)
    entity-data (get verified entity-data)
    false
  )
)

;; Public function to get entity details
(define-read-only (get-entity-details (entity principal))
  (map-get? verified-entities entity)
)

;; Admin function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)
