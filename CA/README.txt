+++ Certification Authority +++

==================================================================

Zertifikatsanfragen (CSR): 

Input:

Methode: HTTP PUSH auf /certificateRequests
Format: text/plain
Inhalt: Mithilfe von OpenSSL generierte CSR

Output:

Methode: HTTP PUSH
Format: text/plain
Inhalt: Mithilfe von OpenSSL generiertes Zertifikat oder Error
Return codes: 200 bei Erfolg, 500 bei Fehler.

==================================================================

Zertifikat sperren lassen:

TODO

==================================================================

Zugriff auf Zertifikatssperrliste (CRL):

Input:

Methode: HTTP GET auf /crl (Url ist zusätlich innerhalb der von der CA ausgestellten Zertifikate kodiert)

Output:

Methode: HTTP PUSH
Format: text/plain
Inhalt: Von OpenSSL generierte CRL als Text.
Return codes: 200 bei Erfolg, 500 oder 404 bei Fehler.
