;; Access Control Contract
;; Manages permissions for data sharing

;; Permission types
;; u1 = Read-only
;; u2 = Read and analyze
;; u3 = Full access (read, analyze, redistribute)

;; Map to store access permissions
(define-map access-permissions
  { asset-id: uint, accessor: principal }
  {
    permission-type: uint,
    granted-by: principal,
    granted-at: uint,
    expiration: uint
  }
)

;; Public function to grant access to a data asset
(define-public (grant-access
    (asset-id uint)
    (accessor principal)
    (permission-type uint)
    (duration uint))
  (let
    (
      (caller tx-sender)
      (expiration (+ block-height duration))
    )
    ;; Check if caller is the owner of the asset
    ;; This would typically call into the data-asset-registration contract
    ;; For simplicity, we're not implementing this check here

    ;; Grant access permission
    (map-set access-permissions
      { asset-id: asset-id, accessor: accessor }
      {
        permission-type: permission-type,
        granted-by: caller,
        granted-at: block-height,
        expiration: expiration
      }
    )
    (ok true)
  )
)

;; Public function to revoke access to a data asset
(define-public (revoke-access (asset-id uint) (accessor principal))
  (let ((caller tx-sender))
    ;; Check if caller is the one who granted access
    (match (map-get? access-permissions { asset-id: asset-id, accessor: accessor })
      permission-data (begin
        (asserts! (is-eq caller (get granted-by permission-data)) (err u403))
        (map-delete access-permissions { asset-id: asset-id, accessor: accessor })
        (ok true)
      )
      (err u404) ;; Permission not found
    )
  )
)

;; Public function to check if an entity has access to a data asset
(define-read-only (has-access (asset-id uint) (accessor principal))
  (match (map-get? access-permissions { asset-id: asset-id, accessor: accessor })
    permission-data (< block-height (get expiration permission-data))
    false
  )
)

;; Public function to get access details
(define-read-only (get-access-details (asset-id uint) (accessor principal))
  (map-get? access-permissions { asset-id: asset-id, accessor: accessor })
)
