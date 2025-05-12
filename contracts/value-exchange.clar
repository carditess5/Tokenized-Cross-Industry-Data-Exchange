;; Value Exchange Contract
;; Handles compensation for data access

;; Define a simple token for data exchange
(define-fungible-token data-token)

;; Initial token supply
(define-constant initial-supply u1000000000)

;; Initialize token supply to contract deployer
(begin
  (ft-mint? data-token initial-supply tx-sender)
)

;; Map to store pricing for data assets
(define-map asset-pricing uint
  {
    view-price: uint,
    download-price: uint,
    analyze-price: uint,
    owner: principal
  }
)

;; Public function to set pricing for a data asset
(define-public (set-asset-pricing
    (asset-id uint)
    (view-price uint)
    (download-price uint)
    (analyze-price uint))
  (let ((caller tx-sender))
    ;; Check if caller is the owner of the asset
    ;; This would typically call into the data-asset-registration contract
    ;; For simplicity, we're not implementing this check here

    ;; Set the pricing
    (map-set asset-pricing asset-id
      {
        view-price: view-price,
        download-price: download-price,
        analyze-price: analyze-price,
        owner: caller
      }
    )
    (ok true)
  )
)

;; Public function to pay for data access
(define-public (pay-for-access
    (asset-id uint)
    (action-type uint))
  (let
    (
      (caller tx-sender)
      (pricing (map-get? asset-pricing asset-id))
    )
    (match pricing
      price-data (begin
        (let
          (
            (amount (if (is-eq action-type u1)
                      (get view-price price-data)
                      (if (is-eq action-type u2)
                        (get download-price price-data)
                        (get analyze-price price-data))))
            (owner (get owner price-data))
          )
          ;; Transfer tokens from caller to asset owner
          (ft-transfer? data-token amount caller owner)
        )
      )
      (err u404) ;; Pricing not found
    )
  )
)

;; Public function to get asset pricing
(define-read-only (get-asset-pricing (asset-id uint))
  (map-get? asset-pricing asset-id)
)

;; Public function to check token balance
(define-read-only (get-balance (account principal))
  (ft-get-balance data-token account)
)
