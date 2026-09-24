#Requires -Version 7.4
Import-Module (Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1') -Force
Connect-ZefSharePointSite -SiteUrl 'https://zurfteempowercare.sharepoint.com/sites/ZEF' -ClientId '265e3a54-3fe7-42fc-8434-7e4f9296b338' -AuthMode Interactive | Out-Null
Get-PnPApp -Scope Site | Where-Object { $_.Title -match 'zef' } | Format-Table Title, AppCatalogVersion, Deployed -AutoSize
Disconnect-PnPOnline
