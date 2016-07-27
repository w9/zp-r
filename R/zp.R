# #' 3D scatter plot on Rstudio viewer
# #'
# #' @export
# #' @examples
# #' library(ggplot2)
# #' data(ret)
# #' qplot3(aes(x=x, y=y, z=z, color=group), data=ret)
# qplot3 <- function(mapping, data, verbose_level=0) {
#   # TODO: mapping sanity check
# 
#   folder_name <- 'js16'
#   temp_dir <- tempdir()
#   if (verbose_level > 1) message(sprintf('Creating directory %s', temp_dir))
# 
#   if (!file.exists(file.path(temp_dir, folder_name))) {
#     plotter_dir <- system.file('zp', package='zp')
#     file.copy(plotter_dir, temp_dir, recursive=T)
#     file.rename(file.path(temp_dir, 'zp'), file.path(temp_dir, folder_name))
#     if (verbose_level > 1) message(sprintf('Copy %s to %s', plotter_dir, temp_dir))
#   }
# 
#   json_string <- jsonlite::toJSON(list(data=data, mapping=lapply(mapping, as.character)),
#                                   dataframe='columns', auto_unbox=T)
# 
#   write(json_string, file.path(temp_dir, folder_name, 'query.json'));
# 
#   rstudioapi::viewer(paste0(file.path(temp_dir, folder_name, 'index.html')))
# }

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
#' zp(patients, zpa(x=pc1, y=pc2, z=pc3, color=patient))
#' zp(patients, list(pca=zpa(x=pc1, y=pc2, z=pc3, color=patient), mds=zpa(x=mds1, y=mds2, z=mds3, color=patient)))
zp <-
  function(data_, mappings_) {
    msg <- list()
    msg$data <- data_
    
    if (class(mappings_) == 'zpa') {
      msg$mappings <- list('unnamed_mapping'=mappings_)
    } else if (class(mappings_) == 'list') {
      if (is.na(names(mappings_))) {
        stop('Error: no names found in mappings_.')
      } else {
        msg$mappings <- mappings_
      }
    } else {
      stop(sprintf('Error: mappings_ has unrecognized class %s.', class(mappings_)))
    }

    sizing_policy <- sizingPolicy(padding=0, browser.fill=T)

    createWidget('zp', msg, sizingPolicy=sizing_policy)
  }
