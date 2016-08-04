# TODO: new API:
#
#                  zp(df) %>%
#                    zp_coord(pc1, pc2, pc3) %>%
#                    zp_coord(mds1, mds2, mds3) %>%
#                    zp_color(group) %>%
#                    zp_color(expr)
# 


#' Aesthetic object for ZP
#'
#' @import pryr
#' @export
zpa <- function(...) {
  output <- lapply(named_dots(...), as.character)
  class(output) <- 'zpa'
  output
}

#' ZP
#'
#' @import htmlwidgets
#' @export
#' @examples
#' data(patients)
#' data(MGH30genes)
#'
#' zp(patients, list(PCA=zpa(x=pc1, y=pc2, z=pc3, color=patient),
#'                   MDS=zpa(x=mds1, y=mds2, z=mds3, color=patient),
#'                   MDS_expr=zpa(x=mds1, y=mds2, z=mds3, color=highly_expressed),
#'                   PCA_expr=zpa(x=pc1, y=pc2, z=pc3, color=highly_expressed)))
#'
#' zp(MGH30genes, list(Correlation_tSNE=zpa(x=tsne1, y=tsne2, z=tsne3, color=pathway)))
zp <-
  function(data_) {
    msg <- list()
    msg$data <- data_
    msg$coord <- list()
    msg$color <- list()
    
    zp <- list()
    zp$msg <- msg
    class(zp) <- 'zp'
    zp
  }

# zp$msg $ data $ col1 = [ ... ]
#               $ col2 = [ ... ]
#               $ col3 = [ ... ]
#               $ col4 = [ ... ]
#               $ col5 = [ ... ]
#               $ col6 = [ ... ]
#               $ col7 = [ ... ]
#               $ col8 = [ ... ]
#
#        $ mapping $ coord $ coord1 = ['col1', 'col2', 'col3']
#                          $ coord2 = ['col4', 'col5', 'col6']
#
#                  $ color $ color1 = 'col7'
#                          $ color2 = 'col8'

zp_color <- function(zp, name, color) {
 zp$color[[name]] <- list( color = as.character(substitute(color)) )
}

zp_coord <- function(zp, name, x, y, z) {
  zp$coord[[name]] <- list( x = as.character(substitute(x)),
                            y = as.character(substitute(y)),
                            z = as.character(substitute(z)) )
}

print.zp <-
  function(zp, use_viewer=T) {
    sizing_policy <- sizingPolicy(padding=0, browser.fill=T, viewer.suppress=!use_viewer)
    createWidget('zp', zp$msg, sizingPolicy=sizing_policy)
  }
