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

Input:

Methode: HTTP PUSH auf /revokeCert (Wird NUR von Localhost akzeptiert)
Format: text/plain
Inhalt: ID des zu sperrenden Zertifikats (z.B. 1013)

Output:

Methode: HTTP PUSH
Format: text/plain
Inhalt: Erfolgsmeldung oder Fehler.
Return codes: 200 bei Erfolg, 500 bei Fehler.

==================================================================

Zugriff auf Zertifikatssperrliste (CRL):

Input:

Methode: HTTP GET auf /crl (Url ist zusätlich innerhalb der von der CA ausgestellten Zertifikate kodiert)

Output:

Methode: HTTP PUSH
Format: text/plain
Inhalt: Von OpenSSL generierte CRL als Text oder Errortext.
Return codes: 200 bei Erfolg, 500 bei Fehler.
