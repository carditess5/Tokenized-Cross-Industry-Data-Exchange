;; Usage Tracking Contract
;; Monitors consumption of shared data

;; Structure to track usage events
(define-map usage-events uint
  {
    asset-id: uint,
    user: principal,
    action-type: uint, ;; 1=view, 2=download, 3=analyze
    timestamp: uint,
    details: (string-utf8 256)
  }
)

;; Counter for usage event IDs
(define-data-var event-id-counter uint u0)

;; Map to track usage statistics per asset
(define-map asset-usage-stats uint
  {
    total-views: uint,
    total-downloads: uint,
    total-analyses: uint,
    last-accessed: uint
  }
)

;; Public function to record a usage event
(define-public (record-usage
    (asset-id uint)
    (action-type uint)
    (details (string-utf8 256)))
  (let
    (
      (caller tx-sender)
      (new-id (+ (var-get event-id-counter) u1))
      (current-stats (default-to
        { total-views: u0, total-downloads: u0, total-analyses: u0, last-accessed: u0 }
        (map-get? asset-usage-stats asset-id)))
      (updated-stats (merge current-stats
        {
          last-accessed: block-height,
          total-views: (if (is-eq action-type u1)
                          (+ (get total-views current-stats) u1)
                          (get total-views current-stats)),
          total-downloads: (if (is-eq action-type u2)
                             (+ (get total-downloads current-stats) u1)
                             (get total-downloads current-stats)),
          total-analyses: (if (is-eq action-type u3)
                            (+ (get total-analyses current-stats) u1)
                            (get total-analyses current-stats))
        }))
    )
    ;; Check if user has access to the asset
    ;; This would typically call into the access-control contract
    ;; For simplicity, we're not implementing this check here

    ;; Record the usage event
    (map-set usage-events new-id
      {
        asset-id: asset-id,
        user: caller,
        action-type: action-type,
        timestamp: block-height,
        details: details
      }
    )

    ;; Update the event counter
    (var-set event-id-counter new-id)

    ;; Update usage statistics
    (map-set asset-usage-stats asset-id updated-stats)

    (ok new-id)
  )
)

;; Public function to get usage event details
(define-read-only (get-usage-event (event-id uint))
  (map-get? usage-events event-id)
)

;; Public function to get asset usage statistics
(define-read-only (get-asset-usage-stats (asset-id uint))
  (default-to
    { total-views: u0, total-downloads: u0, total-analyses: u0, last-accessed: u0 }
    (map-get? asset-usage-stats asset-id)
  )
)
